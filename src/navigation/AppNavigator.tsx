import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../theme/colors';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import FormScreen from '../screens/FormScreen';
import ImportScreen from '../screens/ImportScreen';
import CreditsScreen from '../screens/CreditsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.primary},
          headerTintColor: colors.white,
          headerTitleStyle: {fontWeight: '600'},
          contentStyle: {backgroundColor: colors.primaryBg},
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{title: 'Detalle'}}
        />
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={({route}: any) => ({
            title: route.params?.persona ? 'Editar persona' : 'Nueva persona',
          })}
        />
        <Stack.Screen
          name="Import"
          component={ImportScreen}
          options={{title: 'Importar Excel'}}
        />
        <Stack.Screen
          name="Credits"
          component={CreditsScreen}
          options={{title: 'Créditos'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
