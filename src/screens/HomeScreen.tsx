import {useCallback, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {Persona} from '../database/types';
import {getAllPersonas, refreshPersonas} from '../database/personas';
import {getCachedPersonas} from '../database/personasCache';
import {FiltroFecha} from '../utils/filtros';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import PersonaCard from '../components/PersonaCard';
import FiltroChips from '../components/FiltroChips';
import NotificationBanner from '../components/NotificationBanner';
import {showBirthdayNotification} from '../services/notifications';

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

function getMonthDay(): {month: number; day: number} {
  const hoy = new Date();
  return {month: hoy.getMonth() + 1, day: hoy.getDate()};
}

export default function HomeScreen({navigation}: any) {
  const {colors} = useTheme();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [query, setQuery] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerData, setBannerData] = useState<{names: string[]}>({names: []});
  const [refreshing, setRefreshing] = useState(false);
  const cargando = useRef(false);

  const cargarDatos = useCallback(async () => {
    if (cargando.current) return;
    cargando.current = true;
    try {
      const data = await getAllPersonas();
      setPersonas(data);
    } finally {
      cargando.current = false;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await refreshPersonas();
      setPersonas(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const cached = getCachedPersonas();
      if (cached) {
        setPersonas(cached);
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (personas.length === 0) return;

    const {month, day} = getMonthDay();

    const hoyCumple = personas.filter(p => {
      if (p.birthday_month && p.birthday_day) {
        return p.birthday_month === month && p.birthday_day === day;
      }
      const fn = new Date(p.fecha_nacimiento);
      return fn.getMonth() + 1 === month && fn.getDate() === day;
    });

    if (hoyCumple.length > 0) {
      const names = hoyCumple.map(p => p.nombre);
      setBannerData({names});
      setShowBanner(true);
      showBirthdayNotification(names);
      return;
    }

    const proximos = personas
      .map(p => {
        const next = getNextBirthdayDate(new Date(p.fecha_nacimiento));
        return {...p, next, diff: getDaysDiff(next)};
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

  const handleChipChange = useCallback((filtro: FiltroFecha) => {
    setFiltroFecha(filtro);
  }, []);

  const filtradas = (() => {
    let result = personas;

    if (filtroFecha === 'hoy') {
      const {month, day} = getMonthDay();
      result = result.filter(
        p =>
          (p.birthday_month === month && p.birthday_day === day),
      );
    } else if (filtroFecha === 'mes') {
      const {month} = getMonthDay();
      result = result.filter(p => p.birthday_month === month);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        p =>
          p.nombre.toLowerCase().includes(q) ||
          p.ci.toLowerCase().includes(q),
      );
    }

    return result;
  })();

  const fechaActual = format(new Date(), "EEEE d 'de' MMMM yyyy, HH:mm", {
    locale: es,
  });

  return (
    <View style={[styles.container, {backgroundColor: colors.primaryBg}]}>
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

      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Image
            source={require('../assets/logo.png')}
            style={[styles.logo, {backgroundColor: colors.white}]}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title}>STMSC</Text>
            <Text style={styles.subtitle}>Cumpleañeros</Text>
          </View>
          <Text style={styles.headerDate}>{fechaActual}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Buscar por nombre o CI..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FiltroChips filtroActivo={filtroFecha} onChange={handleChipChange} />

      <FlatList
        data={filtradas}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <PersonaCard
            persona={item}
            onPress={() => navigation.navigate('Detail', {persona: item})}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              No se encontraron personas
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, {backgroundColor: colors.primary}]}
          onPress={() => navigation.navigate('Form', {persona: null})}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
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
  logo: {width: 48, height: 48, borderRadius: 24},
  title: {fontSize: 22, fontWeight: '700', color: '#FFFFFF'},
  subtitle: {fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  headerDate: {
    flex: 1,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  menuBtn: {marginLeft: 8, padding: 4},
  menuIcon: {fontSize: 24, color: '#FFFFFF'},
  searchContainer: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4},
  searchInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    elevation: 2,
  },
  list: {paddingTop: 8, paddingBottom: 100},
  empty: {alignItems: 'center', marginTop: 80},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyText: {fontSize: 16},
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {fontSize: 24, color: '#FFFFFF', fontWeight: '600'},
});
