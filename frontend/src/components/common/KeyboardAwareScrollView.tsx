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
  findNodeHandle,
  Keyboard,
  KeyboardEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
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
      extraScrollHeight = 80,
      contentContainerStyle,
      style,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = 'on-drag',
      automaticallyAdjustKeyboardInsets = true,
      ...restProps
    },
    ref
  ) => {
    const scrollRef = useRef<any>(null);
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
    const lastFocusedRef = useRef<any>(null);

    // Track keyboard show and hide on both Android and iOS
    useEffect(() => {
      const onKeyboardShow = (event: KeyboardEvent) => {
        const height = event?.endCoordinates?.height || 280;
        setKeyboardHeight(height);

        // If a field was just focused, re-scroll it into view after the keyboard has fully expanded
        if (lastFocusedRef.current) {
          triggerScroll(lastFocusedRef.current, height);
        }
      };

      const onKeyboardHide = () => {
        setKeyboardHeight(0);
        lastFocusedRef.current = null;
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
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);

    const triggerScroll = useCallback(
      (
        targetRef: any,
        activeKeyboardHeight: number = keyboardHeight
      ) => {
        if (!targetRef?.current || !scrollRef.current) {
          return;
        }

        const executeMeasureAndScroll = () => {
          try {
            const scrollInstance = scrollRef.current;
            const targetInstance = targetRef.current;
            if (!scrollInstance || !targetInstance) {
              return;
            }

            const scrollNode =
              typeof findNodeHandle === 'function'
                ? findNodeHandle(scrollInstance) || scrollInstance
                : scrollInstance;

            if (!scrollNode) {
              return;
            }

            if (typeof targetInstance.measureLayout === 'function') {
              targetInstance.measureLayout(
                scrollNode,
                (_left: number, top: number, _width: number, _height: number) => {
                  // Generous offset so the input label and input container sit comfortably in view
                  const desiredOffset = Math.max(0, top - extraScrollHeight);
                  scrollRef.current?.scrollTo({
                    y: desiredOffset,
                    animated: true,
                  });
                },
                () => {
                  scrollRef.current?.scrollTo({
                    y: Math.max(0, activeKeyboardHeight / 2),
                    animated: true,
                  });
                }
              );
            } else {
              scrollRef.current?.scrollTo({
                y: Math.max(0, activeKeyboardHeight / 2),
                animated: true,
              });
            }
          } catch {
            // Safe fallback
          }
        };

        // Dual-tick execution: immediate tick for instant feedback + delayed tick when soft keyboard finishes slide-in
        setTimeout(executeMeasureAndScroll, 60);
        setTimeout(executeMeasureAndScroll, 220);
      },
      [extraScrollHeight, keyboardHeight]
    );

    const scrollToInput = useCallback(
      (inputRef: any) => {
        lastFocusedRef.current = inputRef;
        triggerScroll(inputRef);
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

    // Dynamically expand bottom padding so user can scroll any field completely clear of the keyboard
    const dynamicPaddingBottom =
      keyboardHeight > 0
        ? basePaddingBottom + keyboardHeight + extraScrollHeight
        : basePaddingBottom;

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
