import {Alert, StyleSheet, Switch as RNSwitch, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {setupNotifications, cancelAllNotifications} from '../services/notifications';
import {limpiarPersonas} from '../database/personas';
import {canAccess} from '../utils/permissions';

export default function ConfiguracionScreen({navigation}: any) {
  const {colors, mode, toggleTheme} = useTheme();
  const {user, logout} = useAuth();
  const hasConfigAccess = canAccess(user?.permissions, 'configuracion');
  const isConfigAdmin = user?.permissions?.configuracion === 'admin';

  const handleImport = () => {
    navigation.navigate('Import');
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpiar datos',
      '¿Eliminar todos los cumpleañeros? Esta acción no se puede deshacer.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await limpiarPersonas();
            Alert.alert('Listo', 'Datos eliminados correctamente');
          },
        },
      ],
    );
  };

  const handleCredits = () => {
    navigation.navigate('Credits');
  };

  const OptionRow = ({
    label,
    right,
    onPress,
  }: {
    label: string;
    right?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionRow, {borderBottomColor: colors.border}]}
      onPress={onPress}
      disabled={!onPress}>
      <Text style={[styles.optionLabel, {color: colors.textPrimary}]}>{label}</Text>
      {right || (
        <Text style={{color: colors.textSecondary, fontSize: 16}}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.primaryBg}]}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Configuración</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
          APARIENCIA
        </Text>
        <View style={[styles.card, {backgroundColor: colors.surface}]}>
          <OptionRow
            label="Modo oscuro"
            right={
              <RNSwitch
                value={mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{false: colors.border, true: colors.primaryLight}}
                thumbColor={mode === 'dark' ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </View>
      </View>

      {hasConfigAccess && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
            NOTIFICACIONES
          </Text>
          <View style={[styles.card, {backgroundColor: colors.surface}]}>
            <OptionRow
              label="Reconfigurar notificaciones"
              onPress={async () => {
                await setupNotifications();
                Alert.alert('Listo', 'Notificaciones reconfiguradas');
              }}
            />
            <OptionRow
              label="Cancelar todas las notificaciones"
              onPress={async () => {
                await cancelAllNotifications();
                Alert.alert('Listo', 'Notificaciones canceladas');
              }}
            />
          </View>
        </View>
      )}

      {isConfigAdmin && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
            DATOS DE CUMPLEAÑEROS
          </Text>
          <View style={[styles.card, {backgroundColor: colors.surface}]}>
            <OptionRow label="Importar Excel" onPress={handleImport} />
            <OptionRow label="Limpiar datos" onPress={handleClearData} />
          </View>
          <Text style={[styles.hintText, {color: colors.textSecondary}]}>
            Para importar datos de funcionarios, debes realizarlos desde el módulo Gestión
          </Text>
        </View>
      )}

      {hasConfigAccess && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
            INFORMACIÓN
          </Text>
          <View style={[styles.card, {backgroundColor: colors.surface}]}>
            <OptionRow label="Créditos" onPress={handleCredits} />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutBtn, {backgroundColor: colors.danger}]}
          onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 16,
  },
  logoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
