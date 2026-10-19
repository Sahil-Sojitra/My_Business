import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircleIcon,
  CheckIcon,
  InfoIcon,
  XIcon,
} from '../components/common/Icon';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  type?: AlertType | 'confirm';
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export interface ToastOptions {
  type: AlertType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3500
}

interface AlertContextType {
  showToast: (
    type: AlertType,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showAlert: (options: DialogOptions) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    destructive?: boolean
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global reference for calling alerts from non-React contexts (services, utilities)
type GlobalAlertHandler = {
  showToast: (
    type: AlertType,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  showAlert: (options: DialogOptions) => void;
};

let globalHandler: GlobalAlertHandler | null = null;

export const alertService = {
  showToast(
    type: AlertType,
    title: string,
    message?: string,
    duration = 3500
  ): void {
    if (globalHandler) {
      globalHandler.showToast(type, title, message, duration);
    } else {
      console.log(`[Alert Toast] [${type.toUpperCase()}] ${title}: ${message || ''}`);
    }
  },

  showSuccess(title: string, message?: string): void {
    alertService.showToast('success', title, message);
  },

  showError(title: string, message?: string): void {
    alertService.showToast('error', title, message);
  },

  showInfo(title: string, message?: string): void {
    alertService.showToast('info', title, message);
  },

  showWarning(title: string, message?: string): void {
    alertService.showToast('warning', title, message);
  },

  showAlert(
    titleOrOptions: string | DialogOptions,
    message?: string,
    buttons?: AlertButton[]
  ): void {
    if (typeof titleOrOptions === 'string') {
      const opts: DialogOptions = {
        title: titleOrOptions,
        message,
        buttons: buttons || [{ text: 'OK', style: 'primary' }],
      };
      if (globalHandler) {
        globalHandler.showAlert(opts);
      }
    } else if (globalHandler) {
      globalHandler.showAlert(titleOrOptions);
    }
  },

  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirm',
    destructive = true
  ): void {
    alertService.showAlert({
      title,
      message,
      type: destructive ? 'error' : 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'primary',
          onPress: onConfirm,
        },
      ],
    });
  },
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();

  // Toast state
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const toastY = useRef(new Animated.Value(-120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog modal state
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const hideToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    Animated.parallel([
      Animated.timing(toastY, {
        toValue: -120,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [toastY, toastOpacity]);

  const showToast = useCallback(
    (
      type: AlertType,
      title: string,
      message?: string,
      duration = 3500
    ) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToast({ type, title, message, duration });

      toastY.setValue(-120);
      toastOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(toastY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      toastTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [hideToast, toastY, toastOpacity]
  );

  const showAlert = useCallback((options: DialogOptions) => {
    setDialog(options);
  }, []);

  const closeDialog = useCallback(() => {
    if (dialog?.onDismiss) {
      dialog.onDismiss();
    }
    setDialog(null);
  }, [dialog]);

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast('success', title, message),
    [showToast]
  );
  const showError = useCallback(
    (title: string, message?: string) => showToast('error', title, message),
    [showToast]
  );
  const showInfo = useCallback(
    (title: string, message?: string) => showToast('info', title, message),
    [showToast]
  );
  const showWarning = useCallback(
    (title: string, message?: string) => showToast('warning', title, message),
    [showToast]
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = 'Confirm',
      destructive = true
    ) => {
      showAlert({
        title,
        message,
        type: destructive ? 'error' : 'info',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: confirmText,
            style: destructive ? 'destructive' : 'primary',
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  // Register global singleton
  React.useEffect(() => {
    globalHandler = { showToast, showAlert };
    return () => {
      globalHandler = null;
    };
  }, [showToast, showAlert]);

  const renderToastIcon = (type: AlertType) => {
    switch (type) {
      case 'success':
        return (
          <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
            <CheckIcon size={14} color="#15803D" strokeWidth={2.6} />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, styles.iconCircleError]}>
            <AlertCircleIcon size={16} color="#DC2626" strokeWidth={2.4} />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconCircle, styles.iconCircleWarning]}>
            <AlertCircleIcon size={16} color="#D97706" strokeWidth={2.4} />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, styles.iconCircleInfo]}>
            <InfoIcon size={16} color="#2563EB" strokeWidth={2.4} />
          </View>
        );
    }
  };

  const getToastBorderColor = (type: AlertType) => {
    switch (type) {
      case 'success':
        return '#86EFAC';
      case 'error':
        return '#FCA5A5';
      case 'warning':
        return '#FCD34D';
      case 'info':
      default:
        return '#93C5FD';
    }
  };

  return (
    <AlertContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showAlert,
        showConfirm,
      }}>
      {children}

      {/* 1. Custom Animated Top Toast Banner */}
      {toast ? (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top, 14) + 6,
              transform: [{ translateY: toastY }],
              opacity: toastOpacity,
              borderColor: getToastBorderColor(toast.type),
            },
          ]}
          pointerEvents="box-none">
          <TouchableOpacity
            style={styles.toastInner}
            onPress={hideToast}
            activeOpacity={0.9}>
            {renderToastIcon(toast.type)}
            <View style={styles.toastTextWrapper}>
              <Text style={styles.toastTitle}>{toast.title}</Text>
              {toast.message ? (
                <Text style={styles.toastMessage} numberOfLines={3}>
                  {toast.message}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={hideToast}
              style={styles.toastCloseBtn}
              activeOpacity={0.7}>
              <XIcon size={14} color="#94A3B8" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {/* 2. Custom Sleek Dialog Alert / Confirm Modal */}
      {dialog ? (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={closeDialog}>
          <TouchableOpacity
            style={styles.dialogOverlay}
            activeOpacity={1}
            onPress={closeDialog}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogBox}>
                {/* Header Icon Badge */}
                <View style={styles.dialogBadgeRow}>
                  {dialog.type === 'error' ? (
                    <View style={[styles.dialogIconCircle, styles.dialogIconError]}>
                      <AlertCircleIcon size={24} color="#DC2626" strokeWidth={2.4} />
                    </View>
                  ) : dialog.type === 'success' ? (
                    <View
                      style={[styles.dialogIconCircle, styles.dialogIconSuccess]}>
                      <CheckIcon size={22} color="#16A34A" strokeWidth={2.8} />
                    </View>
                  ) : dialog.type === 'warning' ? (
                    <View
                      style={[styles.dialogIconCircle, styles.dialogIconWarning]}>
                      <AlertCircleIcon size={24} color="#D97706" strokeWidth={2.4} />
                    </View>
                  ) : (
                    <View style={[styles.dialogIconCircle, styles.dialogIconInfo]}>
                      <InfoIcon size={24} color="#2563EB" strokeWidth={2.4} />
                    </View>
                  )}
                </View>

                {/* Title & Message */}
                <Text style={styles.dialogTitle}>{dialog.title}</Text>
                {dialog.message ? (
                  <Text style={styles.dialogMessage}>{dialog.message}</Text>
                ) : null}

                {/* Custom Action Buttons */}
                <View style={styles.dialogButtonsRow}>
                  {(
                    dialog.buttons || [{ text: 'OK', style: 'primary' }]
                  ).map((btn, index) => {
                    const isDestructive = btn.style === 'destructive';
                    const isCancel = btn.style === 'cancel';
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dialogBtn,
                          isCancel
                            ? styles.dialogBtnCancel
                            : isDestructive
                            ? styles.dialogBtnDestructive
                            : styles.dialogBtnPrimary,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setDialog(null);
                          if (btn.onPress) {
                            btn.onPress();
                          }
                        }}>
                        <Text
                          style={[
                            styles.dialogBtnText,
                            isCancel
                              ? styles.dialogBtnTextCancel
                              : isDestructive
                              ? styles.dialogBtnTextDestructive
                              : styles.dialogBtnTextPrimary,
                          ]}>
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </AlertContext.Provider>
  );
};

export function useAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  // Toast styles
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: {
    backgroundColor: '#DCFCE7',
  },
  iconCircleError: {
    backgroundColor: '#FEE2E2',
  },
  iconCircleWarning: {
    backgroundColor: '#FEF3C7',
  },
  iconCircleInfo: {
    backgroundColor: '#DBEAFE',
  },
  toastTextWrapper: {
    flex: 1,
    paddingRight: 4,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  toastMessage: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  toastCloseBtn: {
    padding: 6,
    marginLeft: 'auto',
  },

  // Custom Alert Modal styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  dialogBadgeRow: {
    marginBottom: 14,
  },
  dialogIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogIconSuccess: {
    backgroundColor: '#DCFCE7',
  },
  dialogIconError: {
    backgroundColor: '#FEE2E2',
  },
  dialogIconWarning: {
    backgroundColor: '#FEF3C7',
  },
  dialogIconInfo: {
    backgroundColor: '#DBEAFE',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dialogBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnPrimary: {
    backgroundColor: '#2563EB',
  },
  dialogBtnDestructive: {
    backgroundColor: '#DC2626',
  },
  dialogBtnCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dialogBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  dialogBtnTextPrimary: {
    color: '#FFFFFF',
  },
  dialogBtnTextDestructive: {
    color: '#FFFFFF',
  },
  dialogBtnTextCancel: {
    color: '#475569',
  },
});
