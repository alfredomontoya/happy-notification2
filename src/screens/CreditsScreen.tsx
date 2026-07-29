import {Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import Logo from '../assets/logo.svg';

const credits = [
  {rol: '👨‍💻 DESARROLLADOR BACKEND', nombre: 'ING. ALFREDO MONTOYA'},
  {rol: '🎨 DESARROLLADOR FRONTEND', nombre: 'ING. CRISTIAN PIZARROSO'},
];

export default function CreditsScreen() {
  const {colors} = useTheme();
  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.primaryBg}]}
      contentContainerStyle={styles.content}>
      <View style={[styles.card, {backgroundColor: colors.surface}]}>
        <Logo width={220} height={74} style={styles.logo} />
        <Text style={[styles.title, {color: colors.textPrimary}]}>Créditos</Text>

        <View style={[styles.divider, {backgroundColor: colors.border}]} />

        {credits.map(c => (
          <View key={c.rol} style={styles.creditRow}>
            <Text style={[styles.rol, {color: colors.textSecondary}]}>{c.rol}</Text>
            <Text style={[styles.nombre, {color: colors.textPrimary}]}>{c.nombre}</Text>
          </View>
        ))}

        <View style={[styles.divider, {backgroundColor: colors.border}]} />

        <Text style={[styles.rights, {color: colors.textSecondary}]}>
          Derechos Reservados © 2026
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL('https://sofcruz.com.bo')}>
          <Text style={[styles.website, {color: colors.primary}]}>sofcruz.com.bo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  divider: {
    width: '80%',
    height: 1,
    marginVertical: 20,
  },
  creditRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rol: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '600',
  },
  rights: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  website: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
