import {Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../theme/colors';

const credits = [
  {rol: 'PROGRAMADOR BACKEND', nombre: 'ING. ALFREDO MONTOYA'},
  {rol: 'PROGRAMADOR FRONTEND', nombre: 'ING. CRISTIAN PIZARROSO'},
];

export default function CreditsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>SC</Text>
        </View>
        <Text style={styles.title}>Créditos</Text>

        <View style={styles.divider} />

        {credits.map(c => (
          <View key={c.rol} style={styles.creditRow}>
            <Text style={styles.rol}>{c.rol}</Text>
            <Text style={styles.nombre}>{c.nombre}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.rights}>
          Derechos Reservados © 2026
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL('https://sofcruz.com.bo')}>
          <Text style={styles.website}>sofcruz.com.bo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  content: {
    padding: 16,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  creditRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  rol: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  nombre: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rights: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  website: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
