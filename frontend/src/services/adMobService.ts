import mobileAds from 'react-native-google-mobile-ads';

/**
 * Official Google AdMob Test Ad Unit ID for Android Banners
 * @see https://developers.google.com/admob/android/test-ads#sample_ad_units
 */
export const ADMOB_TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

/**
 * Official Google AdMob Test Ad Unit ID for Android Native Ads
 * @see https://developers.google.com/admob/android/test-ads#sample_ad_units
 */
export const ADMOB_TEST_NATIVE_ID = 'ca-app-pub-3940256099942544/2247696110';

/**
 * Active Banner Ad Unit ID.
 * Kept in this centralized service for straightforward transition to production IDs later.
 */
export const ACTIVE_BANNER_AD_UNIT_ID = ADMOB_TEST_BANNER_ID;

/**
 * Active Native Ad Unit ID.
 * Kept in this centralized service for straightforward transition to production IDs later.
 */
export const ACTIVE_NATIVE_AD_UNIT_ID = ADMOB_TEST_NATIVE_ID;

let isSdkInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initializes the Google Mobile Ads SDK exactly once at application startup.
 * Suppresses and logs failures so the app never crashes if offline or blocked.
 */
export async function initializeAdMobOnce(): Promise<void> {
  if (isSdkInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const adapterStatuses = await mobileAds().initialize();
      isSdkInitialized = true;
      if (__DEV__) {
        console.log('[AdMob] SDK initialized successfully:', adapterStatuses);
      }
    } catch (error: unknown) {
      // Do not crash the app; log a warning for diagnostics
      console.warn('[AdMob] Failed to initialize Google Mobile Ads SDK:', error);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
