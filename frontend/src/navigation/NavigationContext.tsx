import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { BackHandler } from 'react-native';
import { useAuth } from '../features/auth/AuthContext';
import {
  NavigationContextType,
  NavigationState,
  RootScreenName,
  ScreenParams,
} from '../types/navigation';

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  const [history, setHistory] = useState<NavigationState[]>([
    { screen: isAuthenticated ? 'Home' : 'Login' },
  ]);

  // Sync initial root screen when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      setHistory([{ screen: 'Home' }]);
    } else {
      setHistory([{ screen: 'Login' }]);
    }
  }, [isAuthenticated]);

  const current = history[history.length - 1] || {
    screen: isAuthenticated ? 'Home' : 'Login',
  };

  const navigate = useCallback(
    <T extends RootScreenName>(screen: T, params?: ScreenParams[T]) => {
      setHistory(prev => [...prev, { screen, params }]);
    },
    []
  );

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.slice(0, prev.length - 1);
    });
  }, []);

  const reset = useCallback(
    <T extends RootScreenName>(screen: T, params?: ScreenParams[T]) => {
      setHistory([{ screen, params }]);
    },
    []
  );

  // Hardware back button support for Android
  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1) {
        goBack();
        return true; // handled
      }
      return false; // let system exit app if on root screen
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [history.length, goBack]);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen: current.screen,
        params: current.params,
        canGoBack: history.length > 1,
        navigate,
        goBack,
        reset,
      }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
