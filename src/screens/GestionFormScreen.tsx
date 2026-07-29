import {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Gestion} from '../database/types';
import {createGestion, updateGestion} from '../database/gestion';
import {can} from '../utils/permissions';
import {
  countFuncionariosByGestion,
  deleteFuncionariosByGestion,
} from '../database/funcionarios';

export default function GestionFormScreen({route, navigation}: any) {
  const {colors} = useTheme();
  const {user} = useAuth();
  const existing: Gestion | null = route.params?.gestion ?? null;
  const isEdit = !!existing;
  const canAccess = can(user?.permissions, 'gestiones', isEdit ? 'edit' : 'create');

  useEffect(() => {
    if (!canAccess) {
      navigation.goBack();
    }
  }, [canAccess, navigation]);

  const [year, setYear] = useState(
    existing ? String(existing.year) : String(new Date().getFullYear()),
  );
  const [titulo, setTitulo] = useState(existing?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(existing?.descripcion ?? '');
  const [estado, setEstado] = useState(existing?.estado ?? 'activo');
  const [funcionariosCount, setFuncionariosCount] = useState(0);

  useEffect(() => {
    if (existing) {
      countFuncionariosByGestion(existing.id).then(setFuncionariosCount);
    }
  }, [existing]);

  const handleSave = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      Alert.alert('Error', 'Ingrese un año válido');
      return;
    }

    if (isEdit) {
      await updateGestion(existing!.id, {
        year: yearNum,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado: estado.trim(),
      });
    } else {
      await createGestion({
        user_id: user?.uid ?? '',
        year: yearNum,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado: estado.trim(),
      });
    }

    Toast.show({
      type: 'success',
      text1: isEdit ? 'Gestión actualizada' : 'Gestión creada',
      text2: isEdit ? 'Los cambios se guardaron correctamente' : 'La nueva gestión se creó correctamente',
      visibilityTime: 2000,
    });
    navigation.goBack();
  };

  if (!canAccess) return null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.primaryBg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.card, {backgroundColor: colors.surface}]}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            {isEdit ? 'Editar gestión' : 'Nueva gestión'}
          </Text>

          <Input
            label="Año *"
            value={year}
            onChange={setYear}
            colors={colors}
            keyboardType="number-pad"
          />
          <Input
            label="Título *"
            value={titulo}
            onChange={setTitulo}
            colors={colors}
          />
          <Input
            label="Descripción"
            value={descripcion}
            onChange={setDescripcion}
            colors={colors}
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, {color: colors.textSecondary}]}>
              Estado
            </Text>
            <View style={styles.switchRight}>
              <Text
                style={[
                  styles.switchValue,
                  {color: estado === 'activo' ? colors.primary : colors.danger},
                ]}>
                {estado === 'activo' ? 'Activo' : 'Cerrado'}
              </Text>
              <Switch
                value={estado === 'activo'}
                onValueChange={v => setEstado(v ? 'activo' : 'cerrado')}
                trackColor={{false: colors.border, true: colors.primaryLight}}
                thumbColor={estado === 'activo' ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, {backgroundColor: colors.primary}]}
            onPress={handleSave}>
            <Text style={styles.btnText}>
              {isEdit ? 'Guardar cambios' : 'Crear gestión'}
            </Text>
          </TouchableOpacity>

          {isEdit && (
            <>
              <View style={styles.divider} />
              <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
                DATOS
              </Text>
              <View style={[styles.dataCard, {backgroundColor: colors.primaryBg}]}>
                <Text style={[styles.dataIcon]}>👥</Text>
                <View>
                  <Text style={[styles.dataLabel, {color: colors.textSecondary}]}>
                    Funcionarios registrados
                  </Text>
                  <Text style={[styles.dataValue, {color: colors.textPrimary}]}>
                    {funcionariosCount}
                  </Text>
                </View>
              </View>
              {can(user?.permissions, 'funcionarios', 'import') && (
                <TouchableOpacity
                  style={[styles.importBtn, {backgroundColor: colors.primary}]}
                  onPress={() =>
                    navigation.navigate('ImportExcelFuncionarios', {
                      gestionId: existing!.id,
                    })
                  }>
                  <Text style={styles.importBtnText}>
                    📥 Importar funcionarios
                  </Text>
                </TouchableOpacity>
              )}
              {can(user?.permissions, 'gestiones', 'delete') && (
              <TouchableOpacity
                style={[styles.dangerBtn, {backgroundColor: colors.danger}]}
                onPress={() => {
                  Alert.alert(
                    'Limpiar datos',
                    '¿Eliminar todos los funcionarios de ' +
                      titulo.trim() +
                      ' (' +
                      year +
                      ')?\n\nTotal: ' +
                      funcionariosCount +
                      ' funcionarios',
                    [
                      {text: 'Cancelar', style: 'cancel'},
                      {
                        text: 'Eliminar todo',
                        style: 'destructive',
                        onPress: async () => {
                          await deleteFuncionariosByGestion(existing!.id);
                          setFuncionariosCount(0);
                          Alert.alert('Listo', 'Datos eliminados correctamente');
                        },
                      },
                    ],
                  );
                }}>
                <Text style={styles.dangerBtnText}>Limpiar datos</Text>
              </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({
  label,
  value,
  onChange,
  colors,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: any;
  keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {backgroundColor: colors.primaryBg, color: colors.textPrimary, borderColor: colors.border},
        ]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 0,
  },
  switchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dataIcon: {
    fontSize: 28,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  dangerBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  importBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
