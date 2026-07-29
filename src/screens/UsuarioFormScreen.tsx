import {useState} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import type {Permissions, PermissionLevel, UserProfile} from '../database/types';
import {
  createUserWithPermissions,
  updateUserProfile,
  updateUserPassword,
} from '../database/usuarios';
import {validatePassword} from '../utils/passwordValidator';

const MODULES: (keyof Permissions)[] = [
  'cumpleanios',
  'funcionarios',
  'gestiones',
  'configuracion',
  'usuarios',
];

const LEVELS: PermissionLevel[] = ['none', 'read', 'write', 'admin'];

function LevelSelector({
  value,
  onChange,
  label,
}: {
  value: PermissionLevel;
  onChange: (v: PermissionLevel) => void;
  label: string;
}) {
  const {colors} = useTheme();
  return (
    <View style={styles.levelRow}>
      <Text style={[{color: colors.textPrimary, flex: 1}]}>{label}</Text>
      <View style={styles.levelButtons}>
        {LEVELS.map(l => (
          <TouchableOpacity
            key={l}
            style={[
              styles.levelBtn,
              {
                backgroundColor:
                  value === l ? colors.primary : colors.primaryBg,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onChange(l)}>
            <Text
              style={[
                styles.levelText,
                {color: value === l ? '#FFFFFF' : colors.textPrimary},
              ]}>
              {l === 'none' ? '—' : l === 'read' ? 'R' : l === 'write' ? 'W' : 'A'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function UsuarioFormScreen({route, navigation}: any) {
  const {colors} = useTheme();
  const usuario: UserProfile | null = route.params?.usuario ?? null;
  const isEdit = !!usuario;

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [cargo, setCargo] = useState(usuario?.cargo ?? '');
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'user'>(usuario?.role ?? 'user');
  const [permissions, setPermissions] = useState<Permissions>(
    usuario?.permissions ?? {
      cumpleanios: 'none',
      funcionarios: 'none',
      gestiones: 'none',
      configuracion: 'none',
      usuarios: 'none',
    },
  );

  const updatePermission = (mod: keyof Permissions, level: PermissionLevel) => {
    setPermissions(prev => ({...prev, [mod]: level}));
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'El nombre de usuario es obligatorio');
      return;
    }
    if (!isEdit && !password.trim()) {
      Alert.alert('Error', 'La contraseña es obligatoria');
      return;
    }
    if (password.trim()) {
      const pwError = validatePassword(password.trim());
      if (pwError) {
        Alert.alert('Error', pwError);
        return;
      }
    }

    try {
      if (isEdit && usuario) {
        if (password.trim()) {
          await updateUserPassword(usuario.uid, password.trim());
        }
        await updateUserProfile(usuario.uid, {
          username: username.trim(),
          nombre: nombre.trim(),
          email: email.trim(),
          cargo: cargo.trim(),
          role,
          permissions,
        });
        const msg = password.trim()
          ? 'Contraseña de usuario reseteada correctamente'
          : 'Usuario actualizado correctamente';
        Alert.alert('Éxito', msg);
      } else {
        const autoEmail = email.trim()
          ? email.trim()
          : username.trim().toLowerCase().replace(/\s+/g, '') + '@stmsc.gob.bo';
        await createUserWithPermissions(
          autoEmail,
          password,
          {
            username: username.trim(),
            nombre: nombre.trim(),
            email: autoEmail,
            cargo: cargo.trim(),
            role,
            permissions,
          },
        );
        Alert.alert('Éxito', 'Usuario creado');
      }
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      const msg =
        e.code === 'auth/email-already-in-use'
          ? 'El correo ya está registrado'
          : e.code === 'auth/weak-password'
          ? 'La contraseña debe tener al menos 6 caracteres'
          : e.code === 'functions/unauthenticated'
          ? 'Debes iniciar sesión para realizar esta acción'
          : e.code === 'functions/permission-denied'
          ? 'No tienes permisos de administrador'
          : e.code === 'functions/invalid-argument'
          ? e.message
          : e?.message ?? 'Error al guardar usuario';
      Alert.alert('Error', msg);
    }
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.primaryBg}]}
      contentContainerStyle={styles.content}>
      <View style={[styles.card, {backgroundColor: colors.surface}]}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        </Text>

        <Text style={[styles.label, {color: colors.textPrimary}]}>
          Nombre completo
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.primaryBg,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Nombre completo"
          placeholderTextColor={colors.textSecondary}
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={[styles.label, {color: colors.textPrimary}]}>
          Cargo
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.primaryBg,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Cargo"
          placeholderTextColor={colors.textSecondary}
          value={cargo}
          onChangeText={setCargo}
        />

        <Text style={[styles.label, {color: colors.textPrimary}]}>
          Nombre de usuario
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.primaryBg,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Nombre de usuario"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={[styles.label, {color: colors.textPrimary}]}>
          Correo electrónico
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.primaryBg,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Correo electrónico"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={[styles.label, {color: colors.textPrimary}]}>
          {isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
        </Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              {
                backgroundColor: colors.primaryBg,
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder={isEdit ? 'Nueva contraseña' : 'Contraseña'}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(prev => !prev)}>
            <Text style={[styles.eyeIcon, {color: colors.textSecondary}]}>
              {showPassword ? '🙈' : '👁'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={[{color: colors.textPrimary}]}>Administrador</Text>
          <Switch
            value={role === 'admin'}
            onValueChange={v => setRole(v ? 'admin' : 'user')}
            trackColor={{false: colors.border, true: colors.primaryLight}}
            thumbColor={role === 'admin' ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>

      {role !== 'admin' && (
        <View style={[styles.card, {backgroundColor: colors.surface}]}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
            Permisos
          </Text>

          {MODULES.map(mod => (
            <LevelSelector
              key={mod}
              label={
                mod === 'cumpleanios'
                  ? 'Cumpleaños'
                  : mod === 'funcionarios'
                  ? 'Funcionarios'
                  : mod === 'gestiones'
                  ? 'Gestiones'
                  : 'Configuración'
              }
              value={permissions[mod]}
              onChange={v => updatePermission(mod, v)}
            />
          ))}

          <Text style={[styles.hint, {color: colors.textSecondary}]}>
            R = Leer | W = Escribir | A = Admin | — = Sin acceso
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, {backgroundColor: colors.primary}]}
        onPress={handleSave}>
        <Text style={styles.saveText}>
          {isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 12,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  levelBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
