/**
 * My Business — Mobile Application
 * Entry point preserving SafeAreaProvider
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from './src/context/AlertContext';
import { AuthProvider } from './src/features/auth/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NavigationProvider } from './src/navigation/NavigationContext';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AlertProvider>
        <AuthProvider>
          <NavigationProvider>
            <View style={styles.container}>
              <AppNavigator />
            </View>
          </NavigationProvider>
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default App;
