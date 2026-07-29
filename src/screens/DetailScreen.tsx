import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Persona} from '../database/types';
import {deletePersona} from '../database/personas';
import {can} from '../utils/permissions';

export default function DetailScreen({route, navigation}: any) {
  const {colors} = useTheme();
  const {user} = useAuth();
  const persona: Persona = route.params.persona;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar persona',
      `¿Estás seguro de eliminar a ${persona.nombre}?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deletePersona(persona.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const fields: {label: string; value: string}[] = [
    {label: 'CI', value: persona.ci},
    {label: 'Nombre', value: persona.nombre},
    {label: 'Cargo', value: persona.cargo},
    {label: 'Dependencia', value: persona.dependencia},
    {label: 'Fecha de nacimiento', value: persona.fecha_nacimiento},
  ];

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.primaryBg}]} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, {backgroundColor: colors.primary}]}>
          <Text style={[styles.avatarText, {color: colors.white}]}>
            {persona.nombre
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.nombre, {color: colors.textPrimary}]}>{persona.nombre}</Text>
        <Text style={[styles.cargo, {color: colors.textSecondary}]}>{persona.cargo}</Text>
      </View>

      <View style={[styles.card, {backgroundColor: colors.surface}]}>
        {fields.map((field, index) => (
          <View
            key={field.label}
            style={[
              styles.fieldRow,
              index < fields.length - 1 && [styles.fieldBorder, {borderBottomColor: colors.border}],
            ]}>
            <Text style={[styles.fieldLabel, {color: colors.textSecondary}]}>{field.label}</Text>
            <Text style={[styles.fieldValue, {color: colors.textPrimary}]}>{field.value}</Text>
          </View>
        ))}
      </View>

      {can(user?.permissions, 'cumpleanios', 'edit') ||
      can(user?.permissions, 'cumpleanios', 'delete') ? (
        <View style={styles.actions}>
          {can(user?.permissions, 'cumpleanios', 'edit') && (
            <TouchableOpacity
              style={[styles.editBtn, {backgroundColor: colors.primary}]}
              onPress={() =>
                navigation.navigate('Form', {persona})
              }>
              <Text style={[styles.editBtnText, {color: colors.white}]}>Editar</Text>
            </TouchableOpacity>
          )}
          {can(user?.permissions, 'cumpleanios', 'delete') && (
            <TouchableOpacity style={[styles.deleteBtn, {backgroundColor: colors.surface, borderColor: colors.danger}]} onPress={handleDelete}>
              <Text style={[styles.deleteBtnText, {color: colors.danger}]}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  nombre: {
    fontSize: 22,
    fontWeight: '700',
  },
  cargo: {
    fontSize: 15,
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldRow: {
    paddingVertical: 14,
  },
  fieldBorder: {
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
