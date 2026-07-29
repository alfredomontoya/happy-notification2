import {useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import type {UserProfile} from '../database/types';
import {
  getAllUsers,
  deleteUserProfile,
  updateUserPassword,
} from '../database/usuarios';
import {validatePassword} from '../utils/passwordValidator';

export default function UsuariosScreen({navigation}: any) {
  const {colors} = useTheme();
  const {user: currentUser} = useAuth();
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [resetTarget, setResetTarget] = useState<{
    uid: string;
    nombre: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const cargar = useCallback(async () => {
    const data = await getAllUsers();
    setUsuarios(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const handleDelete = (uid: string, nombre: string) => {
    if (uid === currentUser?.uid) {
      Alert.alert('Error', 'No puedes eliminarte a ti mismo');
      return;
    }
    Alert.alert('Eliminar usuario', `¿Eliminar a ${nombre}?`, [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserProfile(uid);
            cargar();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el usuario');
          }
        },
      },
    ]);
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;

    const pass = newPassword.trim();
    if (!pass) {
      Alert.alert('Error', 'Ingresa la nueva contraseña');
      return;
    }
    const error = validatePassword(pass);
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    setResetLoading(true);
    try {
      await updateUserPassword(resetTarget.uid, pass);
      const nombre = resetTarget.nombre;
      setResetTarget(null);
      setNewPassword('');
      setResetLoading(false);
      Alert.alert(
        'Contraseña actualizada',
        `La contraseña de ${nombre} se cambió correctamente.`,
      );
    } catch (e: any) {
      setResetLoading(false);
      const msg =
        e?.message ?? 'No se pudo cambiar la contraseña';
      Alert.alert('Error', msg);
    }
  };

  const renderItem = ({item}: {item: UserProfile}) => (
    <View style={[styles.card, {backgroundColor: colors.surface}]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.nombre, {color: colors.textPrimary}]}>
          {item.nombre}
        </Text>
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor:
                item.role === 'admin'
                  ? colors.primary
                  : colors.accent,
            },
          ]}>
          <Text style={styles.roleText}>
            {item.role === 'admin' ? 'Admin' : 'Usuario'}
          </Text>
        </View>
      </View>
      <Text style={[styles.email, {color: colors.textSecondary}]}>
        {item.email}
      </Text>
      <Text style={[styles.username, {color: colors.textSecondary}]}>
        @{item.username}
      </Text>
      <Text style={[styles.cargo, {color: colors.textSecondary}]}>
        {item.cargo}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, {backgroundColor: colors.primary}]}
          onPress={() =>
            navigation.navigate('UsuarioForm', {usuario: item})
          }>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, {backgroundColor: colors.accent}]}
          onPress={() =>
            setResetTarget({uid: item.uid, nombre: item.nombre})
          }>
          <Text style={styles.btnText}>Resetear</Text>
        </TouchableOpacity>
        {item.role !== 'admin' && (
          <TouchableOpacity
            style={[styles.btn, {backgroundColor: colors.danger}]}
            onPress={() => handleDelete(item.uid, item.nombre)}>
            <Text style={styles.btnText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.primaryBg}]}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios</Text>
      </View>

      <FlatList
        data={usuarios}
        keyExtractor={item => item.uid}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              No hay usuarios registrados
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, {backgroundColor: colors.primary}]}
        onPress={() =>
          navigation.navigate('UsuarioForm', {usuario: null})
        }>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={resetTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setResetTarget(null);
          setNewPassword('');
        }}>
        <View style={[styles.modalOverlay, {backgroundColor: colors.overlay}]}>
          <View style={[styles.modalCard, {backgroundColor: colors.surface}]}>
            <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>
              Resetear contraseña
            </Text>
            <Text style={[styles.modalDesc, {color: colors.textSecondary}]}>
              Ingresa la nueva contraseña para{' '}
              <Text style={{fontWeight: '700'}}>{resetTarget?.nombre}</Text>
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.primaryBg,
                    color: colors.textPrimary,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Nueva contraseña"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(prev => !prev)}>
                <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}>
                  {showPassword ? '🙈' : '👁'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalBtnCancel,
                  {borderColor: colors.border},
                ]}
                onPress={() => {
                  setResetTarget(null);
                  setNewPassword('');
                }}>
                <Text
                  style={[
                    styles.modalBtnText,
                    {color: colors.textPrimary},
                  ]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {backgroundColor: colors.accent},
                ]}
                onPress={handleConfirmReset}
                disabled={resetLoading}>
                {resetLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.modalBtnText, {color: '#FFFFFF'}]}>
                    Resetear
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuBtn: {
    marginRight: 12,
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  username: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: 'italic',
  },
  cargo: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalBtnCancel: {
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
