import {useCallback, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Funcionario, Gestion} from '../database/types';
import {buscarFuncionarios} from '../database/funcionarios';
import {getAllGestiones} from '../database/gestion';
import {can} from '../utils/permissions';
import PersonaCard from '../components/PersonaCard';

export default function FuncionariosListScreen({navigation}: any) {
  const {colors} = useTheme();
  const {user} = useAuth();
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<string | null>(
    null,
  );
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [query, setQuery] = useState('');
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargarGestiones = useCallback(async () => {
    const data = await getAllGestiones();
    const activas = data.filter(g => g.estado === 'activo');
    setGestiones(activas);
    if (activas.length > 0) {
      if (
        !selectedGestionId ||
        !activas.some(g => g.id === selectedGestionId)
      ) {
        setSelectedGestionId(activas[0].id);
      }
    } else {
      setSelectedGestionId(null);
    }
  }, [selectedGestionId]);

  useEffect(() => {
    cargarGestiones();
  }, [cargarGestiones]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarGestiones();
    });
    return unsubscribe;
  }, [navigation, cargarGestiones]);

  const ejecutarBusqueda = useCallback(
    async (texto: string, gestionId: string) => {
      if (!texto.trim() || !gestionId) {
        setFuncionarios([]);
        return;
      }
      setBuscando(true);
      try {
        const results = await buscarFuncionarios(gestionId, texto);
        setFuncionarios(results);
      } finally {
        setBuscando(false);
      }
    },
    [],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        if (selectedGestionId) {
          ejecutarBusqueda(text, selectedGestionId);
        }
      }, 300);
    },
    [ejecutarBusqueda, selectedGestionId],
  );

  const handleGestionChange = useCallback(
    (id: string) => {
      setSelectedGestionId(id);
      setFuncionarios([]);
      setQuery('');
    },
    [],
  );

  const gestionActual = gestiones.find(g => g.id === selectedGestionId);

  return (
    <View style={[styles.container, {backgroundColor: colors.primaryBg}]}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>FUNCIONARIOS</Text>
            <Text style={styles.subtitle}>
              {gestionActual
                ? gestionActual.titulo + ' (' + gestionActual.year + ')'
                : 'Buscar funcionarios'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.gestionRow}>
        {gestiones.map(g => (
          <TouchableOpacity
            key={g.id}
            style={[
              styles.gestionChip,
              {
                backgroundColor:
                  selectedGestionId === g.id
                    ? colors.primary
                    : colors.surface,
              },
            ]}
            onPress={() => handleGestionChange(g.id)}>
            <Text
              style={[
                styles.gestionChipText,
                {
                  color:
                    selectedGestionId === g.id
                      ? '#FFFFFF'
                      : colors.textPrimary,
                },
              ]}>
              {g.titulo} ({g.year})
            </Text>
          </TouchableOpacity>
        ))}
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
          placeholder="Buscar por nombre, CI o nro..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {buscando && (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.spinner}
        />
      )}

      <FlatList
        data={funcionarios}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <PersonaCard
            persona={{
              id: item.id,
              ci: item.ci,
              nombres: item.nombres,
              apellidos: item.apellidos,
              cargo: item.cargo,
              edificio: item.edificio,
              nro: item.nro,
            }}
            onPress={() =>
              navigation.navigate('FuncionarioDetail', {funcionario: item})
            }
            showBirthday={false}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              {query.trim() ? '🔍' : '👥'}
            </Text>
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              {query.trim()
                ? 'No se encontraron funcionarios'
                : 'Escribe para buscar funcionarios'}
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        {can(user?.permissions, 'funcionarios', 'import') && selectedGestionId && (
          <TouchableOpacity
            style={[styles.fabSmall, {backgroundColor: colors.primary}]}
            onPress={() =>
              navigation.navigate('ImportExcelFuncionarios', {
                gestionId: selectedGestionId,
              })
            }>
            <Text style={styles.fabSmallText}>📊</Text>
          </TouchableOpacity>
        )}
        {can(user?.permissions, 'funcionarios', 'create') && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              if (selectedGestionId) {
                navigation.navigate('FuncionarioForm', {
                  funcionario: null,
                  gestionId: selectedGestionId,
                });
              }
            }}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
  },
  menuBtn: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  gestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  gestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  gestionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    elevation: 2,
  },
  spinner: {
    marginVertical: 8,
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
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSmallText: {
    fontSize: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
