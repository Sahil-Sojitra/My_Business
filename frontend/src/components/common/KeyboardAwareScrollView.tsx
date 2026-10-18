import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from 'react-native';

export interface KeyboardAwareScrollViewRef {
  scrollToInput: (inputRef: any) => void;
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd: (options?: { animated?: boolean }) => void;
  getScrollView: () => any;
}

interface KeyboardScrollContextType {
  scrollToInput: (inputRef: any) => void;
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

const KeyboardScrollContext = createContext<KeyboardScrollContextType | null>(
  null
);

export const useKeyboardScroll = () => useContext(KeyboardScrollContext);

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  extraScrollHeight?: number;
  children: React.ReactNode;
}

export const KeyboardAwareScrollView = forwardRef<
  KeyboardAwareScrollViewRef,
  KeyboardAwareScrollViewProps
>(
  (
    {
      children,
      extraScrollHeight = 85,
      contentContainerStyle,
      style,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = 'on-drag',
      automaticallyAdjustKeyboardInsets = Platform.OS === 'ios',
      onScroll,
      onLayout,
      ...restProps
    },
    ref
  ) => {
    const scrollRef = useRef<any>(null);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
    const lastKnownKeyboardHeight = useRef<number>(290);
    const lastFocusedRef = useRef<any>(null);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track scroll position and scrollview layout
    const scrollYRef = useRef<number>(0);
    const scrollViewLayout = useRef<{ y: number; height: number }>({
      y: 0,
      height: Dimensions.get('window').height,
    });

    const executeScroll = useCallback(
      (targetRef: any, activeKbHeight: number) => {
        const targetInstance = targetRef?.current || targetRef;
        const scrollInstance = scrollRef.current;
        if (!targetInstance || !scrollInstance) {
          return;
        }

        const measureCallback = (
          _x: number,
          y: number,
          _width: number,
          height: number
        ) => {
          if (typeof y !== 'number' || isNaN(y)) {
            return;
          }

          const windowHeight = Dimensions.get('window').height;
          const svLayout = scrollViewLayout.current;
          const currentScrollY = scrollYRef.current;

          // Always account for the soft keyboard height when determining visible space
          const effectiveKb =
            activeKbHeight > 0
              ? activeKbHeight
              : lastKnownKeyboardHeight.current > 0
              ? lastKnownKeyboardHeight.current
              : 290;

          // Visible boundary above the soft keyboard
          const visibleBottom = windowHeight - effectiveKb;

          const targetTop = y;
          const targetBottom = y + height;
          const clearance = extraScrollHeight;

          // Check if target is obscured by the soft keyboard
          if (targetBottom > visibleBottom - clearance) {
            const diff = targetBottom - (visibleBottom - clearance);
            if (diff > 4) {
              scrollInstance.scrollTo({
                y: Math.max(0, currentScrollY + diff),
                animated: true,
              });
            }
          } else if (targetTop < svLayout.y + 10) {
            // Check if target is obscured under the top header
            const diff = targetTop - (svLayout.y + 10);
            if (Math.abs(diff) > 4) {
              scrollInstance.scrollTo({
                y: Math.max(0, currentScrollY + diff),
                animated: true,
              });
            }
          }
        };

        if (typeof targetInstance.measureInWindow === 'function') {
          targetInstance.measureInWindow(measureCallback);
        } else if (typeof targetInstance.measure === 'function') {
          targetInstance.measure(
            (
              _x: number,
              _y: number,
              _w: number,
              h: number,
              _px: number,
              py: number
            ) => {
              measureCallback(_px, py ?? _y, _w, h);
            }
          );
        }
      },
      [extraScrollHeight]
    );

    // Debounced smooth scroll trigger
    const triggerScroll = useCallback(
      (targetRef: any, activeKbHeight?: number) => {
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }
        const kbHeightToUse =
          activeKbHeight !== undefined && activeKbHeight > 0
            ? activeKbHeight
            : keyboardHeight > 0
            ? keyboardHeight
            : lastKnownKeyboardHeight.current || 290;

        scrollTimerRef.current = setTimeout(() => {
          executeScroll(targetRef, kbHeightToUse);
        }, 70);
      },
      [executeScroll, keyboardHeight]
    );

    // Track keyboard show and hide on both Android and iOS
    useEffect(() => {
      const onKeyboardShow = (event: KeyboardEvent) => {
        const height = event?.endCoordinates?.height || 290;
        lastKnownKeyboardHeight.current = height;
        setKeyboardHeight(height);

        // When keyboard finishes expanding, align the focused input comfortably in view
        if (lastFocusedRef.current) {
          if (scrollTimerRef.current) {
            clearTimeout(scrollTimerRef.current);
          }
          scrollTimerRef.current = setTimeout(() => {
            if (lastFocusedRef.current) {
              executeScroll(lastFocusedRef.current, height);
            }
          }, 60);
        }
      };

      const onKeyboardHide = () => {
        setKeyboardHeight(0);
        lastFocusedRef.current = null;
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }
      };

      const showSubscription = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        onKeyboardShow
      );
      const hideSubscription = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        onKeyboardHide
      );

      return () => {
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, [executeScroll]);

    const scrollToInput = useCallback(
      (inputRef: any) => {
        lastFocusedRef.current = inputRef;
        triggerScroll(inputRef, lastKnownKeyboardHeight.current || 290);
      },
      [triggerScroll]
    );

    useImperativeHandle(ref, () => ({
      scrollToInput,
      scrollTo: options => scrollRef.current?.scrollTo(options),
      scrollToEnd: options => scrollRef.current?.scrollToEnd(options),
      getScrollView: () => scrollRef.current,
    }));

    // Extract base padding bottom from passed contentContainerStyle
    const flattenedContainerStyle = StyleSheet.flatten(contentContainerStyle) || {};
    const basePaddingBottom =
      typeof flattenedContainerStyle.paddingBottom === 'number'
        ? flattenedContainerStyle.paddingBottom
        : 24;

    // Expand bottom padding when keyboard is open so the user has sufficient scroll travel
    // for bottom-most inputs (like Consignment / Deal Notes) to reach above the keyboard
    const currentKb =
      keyboardHeight > 0
        ? keyboardHeight
        : lastKnownKeyboardHeight.current > 0
        ? lastKnownKeyboardHeight.current
        : 290;

    const dynamicPaddingBottom =
      keyboardHeight > 0
        ? basePaddingBottom + currentKb + extraScrollHeight
        : basePaddingBottom + 60;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollYRef.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    };

    const handleLayout = (event: any) => {
      scrollViewLayout.current = {
        y: event.nativeEvent.layout.y,
        height: event.nativeEvent.layout.height,
      };
      onLayout?.(event);
    };

    return (
      <KeyboardScrollContext.Provider
        value={{
          scrollToInput,
          keyboardHeight,
          isKeyboardVisible: keyboardHeight > 0,
        }}>
        <ScrollView
          ref={scrollRef}
          style={[styles.scroll, style]}
          contentContainerStyle={[
            contentContainerStyle,
            { paddingBottom: dynamicPaddingBottom },
          ]}
          onScroll={handleScroll}
          onLayout={handleLayout}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
          showsVerticalScrollIndicator={false}
          {...restProps}>
          {children}
        </ScrollView>
      </KeyboardScrollContext.Provider>
    );
  }
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});
