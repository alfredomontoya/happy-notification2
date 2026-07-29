import {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Funcionario} from '../database/types';
import {createFuncionario, updateFuncionario} from '../database/funcionarios';
import {can} from '../utils/permissions';

export default function FuncionarioFormScreen({route, navigation}: any) {
  const {colors} = useTheme();
  const {user} = useAuth();
  const existing: Funcionario | null = route.params?.funcionario ?? null;
  const gestionId: string =
    route.params?.gestionId ?? existing?.gestion_id ?? '';
  const isEdit = !!existing;
  const canAccess = can(user?.permissions, 'funcionarios', isEdit ? 'edit' : 'create');

  useEffect(() => {
    if (!canAccess) {
      navigation.goBack();
    }
  }, [canAccess, navigation]);

  const [nro, setNro] = useState(existing?.nro ?? '');
  const [ci, setCi] = useState(existing?.ci ?? '');
  const [nombres, setNombres] = useState(existing?.nombres ?? '');
  const [apellidos, setApellidos] = useState(existing?.apellidos ?? '');
  const [cargo, setCargo] = useState(existing?.cargo ?? '');
  const [edificio, setEdificio] = useState(existing?.edificio ?? '');
  const [tipo, setTipo] = useState(existing?.tipo ?? '');
  const [responsable, setResponsable] = useState(existing?.responsable ?? '');
  const [telresponsable, setTelresponsable] = useState(
    existing?.telresponsable ?? '',
  );
  const [estado, setEstado] = useState(existing?.estado ?? 'activo');
  const [entregado, setEntregado] = useState(existing?.entregado === 1);

  const handleSave = async () => {
    if (!nombres.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    const data: any = {
      user_id: user?.uid ?? '',
      gestion_id: gestionId,
      nro: nro.trim(),
      ci: ci.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      cargo: cargo.trim(),
      edificio: edificio.trim(),
      tipo: tipo.trim(),
      responsable: responsable.trim(),
      telresponsable: telresponsable.trim(),
      estado: estado.trim(),
      entregado: entregado ? 1 : 0,
    };

    if (isEdit) {
      await updateFuncionario(existing!.id, data);
    } else {
      await createFuncionario(data);
    }

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
            {isEdit ? 'Editar funcionario' : 'Nuevo funcionario'}
          </Text>

          <Input label="Nro" value={nro} onChange={setNro} colors={colors} />
          <Input label="CI" value={ci} onChange={setCi} colors={colors} />
          <Input
            label="Nombres *"
            value={nombres}
            onChange={setNombres}
            colors={colors}
          />
          <Input
            label="Apellidos"
            value={apellidos}
            onChange={setApellidos}
            colors={colors}
          />
          <Input label="Cargo" value={cargo} onChange={setCargo} colors={colors} />
          <Input
            label="Edificio"
            value={edificio}
            onChange={setEdificio}
            colors={colors}
          />
          <Input label="Tipo" value={tipo} onChange={setTipo} colors={colors} />
          <Input
            label="Responsable"
            value={responsable}
            onChange={setResponsable}
            colors={colors}
          />
          <Input
            label="Tel. Responsable"
            value={telresponsable}
            onChange={setTelresponsable}
            colors={colors}
            keyboardType="phone-pad"
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, {color: colors.textSecondary}]}>
              Estado
            </Text>
            <View style={styles.switchOptions}>
              <TouchableOpacity
                style={[
                  styles.switchOption,
                  {
                    backgroundColor:
                      estado === 'activo' ? colors.primary : colors.primaryBg,
                  },
                ]}
                onPress={() => setEstado('activo')}>
                <Text
                  style={[
                    styles.switchOptionText,
                    {color: estado === 'activo' ? '#FFFFFF' : colors.textPrimary},
                  ]}>
                  Activo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.switchOption,
                  {
                    backgroundColor:
                      estado === 'inactivo' ? colors.primary : colors.primaryBg,
                  },
                ]}
                onPress={() => setEstado('inactivo')}>
                <Text
                  style={[
                    styles.switchOptionText,
                    {
                      color:
                        estado === 'inactivo' ? '#FFFFFF' : colors.textPrimary,
                    },
                  ]}>
                  Inactivo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkboxRow,
              {backgroundColor: entregado ? colors.primaryBg : 'transparent'},
            ]}
            onPress={() => setEntregado(!entregado)}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: entregado ? colors.primary : 'transparent',
                  borderColor: entregado ? colors.primary : colors.border,
                },
              ]}>
              {entregado && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, {color: colors.textPrimary}]}>
              Entregado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, {backgroundColor: colors.primary}]}
            onPress={handleSave}>
            <Text style={styles.btnText}>
              {isEdit ? 'Guardar cambios' : 'Crear funcionario'}
            </Text>
          </TouchableOpacity>
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
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  switchOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  switchOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
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
});
