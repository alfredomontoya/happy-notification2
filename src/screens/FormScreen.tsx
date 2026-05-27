import {useState} from 'react';
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
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {format} from 'date-fns';
import {colors} from '../theme/colors';
import {Persona} from '../database/types';
import {createPersonaFromApp, updatePersona} from '../database/personas';

export default function FormScreen({route, navigation}: any) {
  const persona: Persona | null = route.params.persona;
  const isEditing = persona !== null;

  const parseDate = (str: string): Date => {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(1990, 0, 1) : d;
  };

  const [ci, setCi] = useState(persona?.ci ?? '');
  const [nombre, setNombre] = useState(persona?.nombre ?? '');
  const [cargo, setCargo] = useState(persona?.cargo ?? '');
  const [dependencia, setDependencia] = useState(persona?.dependencia ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(
    persona?.fecha_nacimiento ?? '',
  );
  const [date, setDate] = useState(parseDate(persona?.fecha_nacimiento ?? ''));
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setFechaNacimiento(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!fechaNacimiento.trim()) {
      Alert.alert('Error', 'La fecha de nacimiento es obligatoria');
      return;
    }

    const data = {
      ci: ci.trim(),
      nombre: nombre.trim(),
      cargo: cargo.trim(),
      dependencia: dependencia.trim(),
      fecha_nacimiento: fechaNacimiento.trim(),
    };

    try {
      if (isEditing) {
        await updatePersona(persona!.id, data);
      } else {
        await createPersonaFromApp(data);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Ocurrió un error al guardar');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Field
          label="CI"
          value={ci}
          onChangeText={setCi}
          placeholder="1234567"
          keyboardType="numeric"
        />
        <Field
          label="Nombre *"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre completo"
        />
        <Field
          label="Cargo"
          value={cargo}
          onChangeText={setCargo}
          placeholder="Ej: Secretario General"
        />
        <Field
          label="Dependencia"
          value={dependencia}
          onChangeText={setDependencia}
          placeholder="Ej: Dirección de Obras Públicas"
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Fecha de nacimiento *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}>
            <Text style={styles.dateButtonText}>
              {fechaNacimiento
                ? format(parseDate(fechaNacimiento), "d 'de' MMMM yyyy")
                : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Actualizar' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});
