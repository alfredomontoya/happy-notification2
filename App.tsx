import {useEffect} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {
  setupNotifications,
  scheduleDailyReminder,
} from './src/services/notifications';

notifee.onBackgroundEvent(async () => {
  // La app se abre al tocar la notificación (comportamiento por defecto)
});

function App() {
  useEffect(() => {
    setupNotifications();
    scheduleDailyReminder();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
