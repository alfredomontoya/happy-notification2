import {useEffect} from 'react';
import {Image, LogBox, StyleSheet, View} from 'react-native';

LogBox.ignoreLogs([
  'This method is deprecated',
  'all React Native Firebase namespaced API',
]);
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import notifee from '@notifee/react-native';
import Toast from 'react-native-toast-message';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {NetworkProvider} from './src/context/NetworkContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import NetworkBanner from './src/components/NetworkBanner';
import {
  setupNotifications,
  scheduleDailyReminder,
} from './src/services/notifications';

notifee.onBackgroundEvent(async () => {});

function SplashScreen() {
  const {colors} = useTheme();
  return (
    <View style={[styles.splash, {backgroundColor: colors.primaryBg}]}>
      <Image
        source={require('./src/assets/logo.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
    </View>
  );
}

function AppContent() {
  const {user, loading} = useAuth();
  const {mode, colors} = useTheme();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <>
      <NetworkBanner />
      {!user ? (
        <LoginScreen />
      ) : (
        <NavigationContainer
          theme={{
            dark: mode === 'dark',
            colors: {
              primary: colors.primary,
              background: colors.primaryBg,
              card: colors.surface,
              text: colors.textPrimary,
              border: colors.border,
              notification: colors.accent,
            },
            fonts: {
              regular: {fontFamily: 'System', fontWeight: '400'},
              medium: {fontFamily: 'System', fontWeight: '500'},
              bold: {fontFamily: 'System', fontWeight: '700'},
              heavy: {fontFamily: 'System', fontWeight: '900'},
            },
          }}>
          <AppNavigator />
        </NavigationContainer>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});

function App() {
  useEffect(() => {
    setupNotifications();
    scheduleDailyReminder();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <AppContent />
            <Toast />
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
