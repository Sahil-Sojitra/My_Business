package com.my_business

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class DocumentViewerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newSingleThreadExecutor()

    override fun getName(): String = "DocumentViewer"

    @ReactMethod
    fun openDocument(
        fileUriOrUrl: String,
        mimeType: String,
        title: String,
        promise: Promise
    ) {
        executor.execute {
            try {
                val effectiveMime = if (mimeType.isNotBlank()) mimeType else "application/pdf"
                val isImage = effectiveMime.startsWith("image/", ignoreCase = true)
                val uri: Uri

                if (fileUriOrUrl.startsWith("http://", ignoreCase = true) ||
                    fileUriOrUrl.startsWith("https://", ignoreCase = true)
                ) {
                    // Download remote file into cache so native Viewers can open it
                    val url = URL(fileUriOrUrl)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.connectTimeout = 15000
                    conn.readTimeout = 30000
                    conn.instanceFollowRedirects = true

                    val documentsDir = File(reactContext.cacheDir, "documents")
                    if (!documentsDir.exists()) {
                        documentsDir.mkdirs()
                    }

                    val pathSegment = url.path.substringAfterLast("/")
                    val safeName = when {
                        pathSegment.contains(".") -> pathSegment
                        isImage -> "${pathSegment.ifBlank { "photo_" + System.currentTimeMillis() }}.jpg"
                        else -> "${pathSegment.ifBlank { "document_" + System.currentTimeMillis() }}.pdf"
                    }

                    val cachedFile = File(documentsDir, safeName)
                    conn.inputStream.use { input ->
                        FileOutputStream(cachedFile).use { output ->
                            input.copyTo(output)
                        }
                    }

                    uri = FileProvider.getUriForFile(
                        reactContext,
                        "${reactContext.packageName}.fileprovider",
                        cachedFile
                    )
                } else if (fileUriOrUrl.startsWith("file://", ignoreCase = true)) {
                    val file = File(Uri.parse(fileUriOrUrl).path ?: "")
                    uri = FileProvider.getUriForFile(
                        reactContext,
                        "${reactContext.packageName}.fileprovider",
                        file
                    )
                } else if (fileUriOrUrl.startsWith("content://", ignoreCase = true)) {
                    val contentUri = Uri.parse(fileUriOrUrl)
                    if (contentUri.authority == "${reactContext.packageName}.fileprovider") {
                        uri = contentUri
                    } else {
                        // Copy content to our cache dir so external apps will have guaranteed read permissions
                        val documentsDir = File(reactContext.cacheDir, "documents")
                        if (!documentsDir.exists()) {
                            documentsDir.mkdirs()
                        }
                        val safeName = if (isImage) "photo_${System.currentTimeMillis()}.jpg" else "document_${System.currentTimeMillis()}.pdf"
                        val cachedFile = File(documentsDir, safeName)
                        reactContext.contentResolver.openInputStream(contentUri)?.use { input ->
                            FileOutputStream(cachedFile).use { output ->
                                input.copyTo(output)
                            }
                        }
                        uri = FileProvider.getUriForFile(
                            reactContext,
                            "${reactContext.packageName}.fileprovider",
                            cachedFile
                        )
                    }
                } else {
                    uri = Uri.parse(fileUriOrUrl)
                }

                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, effectiveMime)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }

                val defaultTitle = if (isImage) "Open photo with..." else "Open document with..."
                val chooser = Intent.createChooser(intent, title.ifBlank { defaultTitle }).apply {
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }

                // Explicitly grant read permission to all matching activities
                val resInfoList = reactContext.packageManager.queryIntentActivities(
                    intent,
                    android.content.pm.PackageManager.MATCH_DEFAULT_ONLY
                )
                for (resolveInfo in resInfoList) {
                    val packageName = resolveInfo.activityInfo.packageName
                    reactContext.grantUriPermission(
                        packageName,
                        uri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                }

                val currentActivity = reactContext.currentActivity
                if (currentActivity != null) {
                    currentActivity.startActivity(chooser)
                } else {
                    reactContext.startActivity(chooser)
                }

                promise.resolve(true)
            } catch (e: ActivityNotFoundException) {
                promise.reject(
                    "NO_VIEWER_APP",
                    "No application was found on your phone to open this file.",
                    e
                )
            } catch (e: Exception) {
                promise.reject("OPEN_FAILED", e.message ?: "Failed to open document", e)
            }
        }
    }
}
