import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Switch, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {getFirstAvailableScreen} from '../utils/permissions';

import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import FormScreen from '../screens/FormScreen';
import ImportScreen from '../screens/ImportScreen';
import CreditsScreen from '../screens/CreditsScreen';
import FuncionariosListScreen from '../screens/FuncionariosListScreen';
import FuncionarioDetailScreen from '../screens/FuncionarioDetailScreen';
import FuncionarioFormScreen from '../screens/FuncionarioFormScreen';
import ImportExcelFuncionariosScreen from '../screens/ImportExcelFuncionariosScreen';
import GestionListScreen from '../screens/GestionListScreen';
import GestionFormScreen from '../screens/GestionFormScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import PerfilScreen from '../screens/PerfilScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import UsuarioFormScreen from '../screens/UsuarioFormScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CumpleaniosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
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
  );
}

function FuncionariosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
      }}>
      <Stack.Screen
        name="FuncionariosList"
        component={FuncionariosListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="FuncionarioDetail"
        component={FuncionarioDetailScreen}
        options={{title: 'Detalle'}}
      />
      <Stack.Screen
        name="FuncionarioForm"
        component={FuncionarioFormScreen}
        options={({route}: any) => ({
          title: route.params?.funcionario
            ? 'Editar funcionario'
            : 'Nuevo funcionario',
        })}
      />
      <Stack.Screen
        name="ImportExcelFuncionarios"
        component={ImportExcelFuncionariosScreen}
        options={{title: 'Importar funcionarios'}}
      />
    </Stack.Navigator>
  );
}

function ConfiguracionStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
      }}>
      <Stack.Screen
        name="ConfigMain"
        component={ConfiguracionScreen}
        options={{headerShown: false}}
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
  );
}

function GestionStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
      }}>
      <Stack.Screen
        name="GestionList"
        component={GestionListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="GestionForm"
        component={GestionFormScreen}
        options={({route}: any) => ({
          title: route.params?.gestion ? 'Editar gestión' : 'Nueva gestión',
        })}
      />
      <Stack.Screen
        name="ImportExcelFuncionarios"
        component={ImportExcelFuncionariosScreen}
        options={{title: 'Importar funcionarios'}}
      />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
      }}>
      <Stack.Screen
        name="PerfilMain"
        component={PerfilScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function CreditsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
      }}>
      <Stack.Screen
        name="Credits"
        component={CreditsScreen}
        options={{title: 'Créditos'}}
      />
    </Stack.Navigator>
  );
}

function UsuariosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#0D9488'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: '600'},
        contentStyle: {backgroundColor: '#F0FDF4'},
      }}>
      <Stack.Screen
        name="UsuariosList"
        component={UsuariosScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="UsuarioForm"
        component={UsuarioFormScreen}
        options={({route}: any) => ({
          title: route.params?.usuario ? 'Editar usuario' : 'Nuevo usuario',
        })}
      />
    </Stack.Navigator>
  );
}

function CustomDrawerContent({navigation}: any) {
  const {colors, mode, toggleTheme} = useTheme();
  const {user, logout} = useAuth();
  const isAdmin = user?.role === 'admin';

  type PermissionKeys = 'cumpleanios' | 'funcionarios' | 'gestiones' | 'configuracion' | 'usuarios';

  interface DrawerItem {
    label: string;
    screen: string;
    permission?: PermissionKeys;
  }

  const allItems: DrawerItem[] = [
    {label: '🎂 Cumpleaños', screen: 'Cumpleaños', permission: 'cumpleanios'},
    {label: '👥 Funcionarios', screen: 'Funcionarios', permission: 'funcionarios'},
    {label: '📁 Gestión', screen: 'Gestión', permission: 'gestiones'},
    {label: '⚙️ Configuración', screen: 'Configuración', permission: 'configuracion'},
    {label: '👤 Perfil', screen: 'Perfil'},
    {label: '🔐 Usuarios', screen: 'Usuarios', permission: 'usuarios'},
    {label: 'ℹ️ Créditos', screen: 'Créditos'},
  ];

  const visibleItems = allItems.filter(item => {
    if (!item.permission || isAdmin) return true;
    const level = user?.permissions?.[item.permission];
    return level && level !== 'none';
  });

  return (
    <View style={[styles.drawerContainer, {backgroundColor: colors.primaryBg}]}>
      <View style={[styles.drawerHeader, {backgroundColor: colors.primary}]}>
        <View
          style={[styles.drawerAvatar, {backgroundColor: colors.primaryLight}]}>
          <Text style={styles.drawerAvatarText}>
            {user?.nombre
              ?.split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() ?? 'AD'}
          </Text>
        </View>
        <Text style={styles.drawerName}>{user?.nombre ?? 'Usuario'}</Text>
        <Text style={styles.drawerRole}>{user?.cargo ?? ''}</Text>
      </View>

      <View style={styles.drawerItems}>
        {visibleItems.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.drawerItem, {borderBottomColor: colors.border}]}
            onPress={() => navigation.navigate(item.screen)}>
            <Text style={[styles.drawerItemText, {color: colors.textPrimary}]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.drawerItem, styles.drawerItemRow, {borderBottomColor: colors.border}]}>
        <Text style={[styles.drawerItemText, {color: colors.textPrimary}]}>
          🌙 Modo oscuro
        </Text>
        <Switch
          value={mode === 'dark'}
          onValueChange={toggleTheme}
          trackColor={{false: colors.border, true: colors.primaryLight}}
          thumbColor={mode === 'dark' ? colors.primary : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, {borderTopColor: colors.border}]}
        onPress={logout}>
        <Text style={[styles.logoutText, {color: colors.danger}]}>
          🚪 Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AppNavigator() {
  const {mode} = useTheme();
  const {user} = useAuth();
  const initialRoute = getFirstAvailableScreen(user?.permissions);

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute}
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
          backgroundColor: mode === 'dark' ? '#1E293B' : '#F0FDF4',
        },
      }}>
      <Drawer.Screen name="Cumpleaños" component={CumpleaniosStack} />
      <Drawer.Screen name="Funcionarios" component={FuncionariosStack} />
      <Drawer.Screen name="Gestión" component={GestionStack} />
      <Drawer.Screen name="Configuración" component={ConfiguracionStack} />
      <Drawer.Screen name="Perfil" component={PerfilStack} />
      <Drawer.Screen name="Usuarios" component={UsuariosStack} />
      <Drawer.Screen name="Créditos" component={CreditsStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  drawerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawerRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  drawerItems: {
    paddingTop: 8,
  },
  drawerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  drawerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutBtn: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
