import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Funcionario} from '../database/types';
import {deleteFuncionario} from '../database/funcionarios';
import {can} from '../utils/permissions';

export default function FuncionarioDetailScreen({route, navigation}: any) {
  const {colors} = useTheme();
  const {user} = useAuth();
  const funcionario: Funcionario = route.params.funcionario;

  const nombreCompleto =
    funcionario.nombres +
    ' ' +
    (funcionario.apellidos ?? '');
  const iniciales = nombreCompleto
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleDelete = () => {
    Alert.alert(
      'Eliminar funcionario',
      '¿Eliminar a ' + funcionario.nombres + '?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteFuncionario(funcionario.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const Row = ({label, value}: {label: string; value: string}) => (
    <View style={[styles.row, {borderBottomColor: colors.border}]}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <Text style={[styles.value, {color: colors.textPrimary}]}>
        {value || '—'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.primaryBg}]}>
      <View style={[styles.card, {backgroundColor: colors.surface}]}>
        <View style={[styles.avatar, {backgroundColor: colors.primary}]}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </View>

        <Text style={[styles.name, {color: colors.textPrimary}]}>
          {nombreCompleto}
        </Text>
        <Text style={[styles.ci, {color: colors.textSecondary}]}>
          CI: {funcionario.ci || '—'}
        </Text>

        <View style={styles.details}>
          <Row label="Nro" value={funcionario.nro} />
          <Row label="Cargo" value={funcionario.cargo} />
          <Row label="Edificio" value={funcionario.edificio} />
          <Row label="Tipo" value={funcionario.tipo} />
          <Row label="Responsable" value={funcionario.responsable} />
          <Row label="Tel. Responsable" value={funcionario.telresponsable} />
          <Row
            label="Estado"
            value={
              funcionario.estado === 'activo' ? 'Activo' : 'Inactivo'
            }
          />
          <Row
            label="Entregado"
            value={funcionario.entregado === 1 ? 'Sí' : 'No'}
          />
        </View>

        {can(user?.permissions, 'funcionarios', 'edit') ||
        can(user?.permissions, 'funcionarios', 'delete') ? (
          <View style={styles.actions}>
            {can(user?.permissions, 'funcionarios', 'edit') && (
              <TouchableOpacity
                style={[styles.btn, {backgroundColor: colors.primary}]}
                onPress={() =>
                  navigation.navigate('FuncionarioForm', {funcionario})
                }>
                <Text style={styles.btnText}>Editar</Text>
              </TouchableOpacity>
            )}
            {can(user?.permissions, 'funcionarios', 'delete') && (
              <TouchableOpacity
                style={[styles.btn, {backgroundColor: colors.danger}]}
                onPress={handleDelete}>
                <Text style={styles.btnText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  ci: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  details: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
