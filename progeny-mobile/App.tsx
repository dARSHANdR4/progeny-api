import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/styles/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens for Root Navigator
import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';

const RootStack = createNativeStackNavigator();

function AppContent() {
  const { isLoading, isAuthenticated, isRecoveringPassword } = useAuth();
  const { isDark, colors, isHighContrast } = useTheme();

  const prefix = Linking.createURL('/');

  const linking = {
    prefixes: [prefix, 'progeny://'],
    config: {
      screens: {
        Main: 'app',
        SignIn: 'signin',
        SignUp: 'signup',
        ForgotPassword: 'forgot-password',
        ResetPassword: 'reset-password',
        ConfirmSignUp: 'signup-confirmed',
      },
    },
  };

  if (isLoading && !isRecoveringPassword) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Priority logic for navigation
  // We show the main app ONLY if authenticated AND NOT in recovery mode
  const showMain = isAuthenticated && !isRecoveringPassword;

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {showMain ? (
          <RootStack.Screen name="Main" component={TabNavigator} />
        ) : (
          <RootStack.Group>
            {/* If we are recovering a password, we MUST put the ResetPassword screen first 
                to ensure React Navigation defaults to it. */}
            {isRecoveringPassword ? (
              <>
                <RootStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <RootStack.Screen name="SignIn" component={SignInScreen} />
              </>
            ) : (
              <>
                <RootStack.Screen name="SignIn" component={SignInScreen} />
                <RootStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              </>
            )}
            <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <RootStack.Screen name="SignUp" component={SignUpScreen} />
          </RootStack.Group>
        )}
      </RootStack.Navigator>
      <StatusBar style={(isDark || isHighContrast) ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SubscriptionProvider>
                <AppContent />
              </SubscriptionProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
