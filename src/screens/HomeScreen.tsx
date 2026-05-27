import {useCallback, useEffect, useState} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../theme/colors';
import {Persona} from '../database/types';
import {getAllPersonas} from '../database/personas';
import {
  filtrarPersonas,
  FiltroFecha,
} from '../utils/filtros';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import PersonaCard from '../components/PersonaCard';
import FiltroChips from '../components/FiltroChips';
import NotificationBanner from '../components/NotificationBanner';
import {showBirthdayNotification} from '../services/notifications';


// ===============================
// 🧠 HELPERS BANNER
// ===============================

function getNextBirthdayDate(fecha: Date): Date {
  const hoy = new Date();
  const cumple = new Date(fecha);

  cumple.setFullYear(hoy.getFullYear());

  if (cumple.getTime() < hoy.getTime()) {
    cumple.setFullYear(hoy.getFullYear() + 1);
  }

  return cumple;
}

function getDaysDiff(date: Date) {
  const hoy = new Date();
  const diff = date.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


// ===============================
// 📱 COMPONENTE
// ===============================

export default function HomeScreen({navigation}: any) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [query, setQuery] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerData, setBannerData] = useState<{names: string[]}>({names: []});

  const cargarDatos = useCallback(async () => {
    const data = await getAllPersonas();
    setPersonas(data);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarDatos();
    });
    return unsubscribe;
  }, [navigation, cargarDatos]);


// ===============================
// 🎉 BANNER INTELIGENTE
// ===============================

useEffect(() => {
  if (personas.length === 0) return;

  const hoy = new Date();

  // 🎯 HOY
  const hoyCumple = personas.filter(p => {
    const fn = new Date(p.fecha_nacimiento);
    return (
      fn.getMonth() === hoy.getMonth() &&
      fn.getDate() === hoy.getDate()
    );
  });

  if (hoyCumple.length > 0) {
    const names = hoyCumple.map(p => p.nombre);
    setBannerData({names});
    setShowBanner(true);

    showBirthdayNotification(names);

    return;
  }

  // 📅 SEMANA (fallback)
  const proximos = personas
    .map(p => {
      const next = getNextBirthdayDate(new Date(p.fecha_nacimiento));
      return {
        ...p,
        next,
        diff: getDaysDiff(next),
      };
    })
    .filter(p => p.diff >= 0 && p.diff <= 7)
    .sort((a, b) => a.diff - b.diff);

  if (proximos.length > 0) {
    setBannerData({
      names: proximos.map(p => {
        if (p.diff === 0) return `${p.nombre} (hoy)`;
        if (p.diff === 1) return `${p.nombre} (mañana)`;
        return `${p.nombre} (en ${p.diff} días)`;
      }),
    });
    setShowBanner(true);
    return;
  }

  setShowBanner(false);
}, [personas]);


// ===============================
// 🔍 FILTRO LISTA
// ===============================

  const fechaActual = format(new Date(), "EEEE d 'de' MMMM yyyy", {
    locale: es,
  });

  const filtradas = filtrarPersonas(personas, query, filtroFecha);


// ===============================
// 🎨 UI
// ===============================

  return (
    <View style={styles.container}>
      {showBanner && (
        <NotificationBanner
          message={
            bannerData.names.some(n => n.includes('(hoy)'))
              ? `🎉 ¡Hoy cumplen años ${bannerData.names.length} personas!`
              : `📅 Próximos cumpleaños (${bannerData.names.length})`
          }
          names={bannerData.names}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title}>STMSC</Text>
            <Text style={styles.subtitle}>Cumpleañeros</Text>
          </View>
          <Text style={styles.headerDate}>{fechaActual}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Credits')}
            style={styles.creditsBtn}>
            <Text style={styles.creditsIcon}>{'\u2699\uFE0E'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o CI..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FiltroChips filtroActivo={filtroFecha} onChange={setFiltroFecha} />

      <FlatList
        data={filtradas}
        keyExtractor={item => String(item.id)}
        renderItem={({item}) => (
          <PersonaCard
            persona={item}
            onPress={() =>
              navigation.navigate('Detail', {persona: item})
            }
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              No se encontraron personas
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabExcel}
          onPress={() => navigation.navigate('Import')}>
          <Text style={styles.fabText}>📊</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Form', {persona: null})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// ===============================
// 🎨 ESTILOS
// ===============================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  header: {
    backgroundColor: colors.primary,
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
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerDate: {
    flex: 1,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  creditsBtn: {
    marginLeft: 8,
    padding: 4,
  },
  creditsIcon: {
    fontSize: 22,
    color: colors.white,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fabExcel: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '600',
  },
});