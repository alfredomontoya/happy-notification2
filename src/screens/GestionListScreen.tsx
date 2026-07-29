import {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {Gestion} from '../database/types';
import {getAllGestiones, deleteGestion} from '../database/gestion';
import {countFuncionariosByGestion} from '../database/funcionarios';
import {can} from '../utils/permissions';

export default function GestionListScreen({navigation}: any) {
  const {colors} = useTheme();
  const {user} = useAuth();
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const cargarDatos = useCallback(async () => {
    const data = await getAllGestiones();
    setGestiones(data);
    const countsMap: Record<string, number> = {};
    await Promise.all(
      data.map(async g => {
        countsMap[g.id] = await countFuncionariosByGestion(g.id);
      }),
    );
    setCounts(countsMap);
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

  const handleDelete = (item: Gestion) => {
    Alert.alert(
      'Eliminar gestión',
      '¿Eliminar la gestión ' + item.titulo + ' (' + item.year + ')?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteGestion(item.id);
            cargarDatos();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.primaryBg}]}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.title}>GESTIÓN</Text>
        </View>
      </View>

      <FlatList
        data={gestiones}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const canEdit = can(user?.permissions, 'gestiones', 'edit');
          const canDel = can(user?.permissions, 'gestiones', 'delete');
          return (
          <TouchableOpacity
            style={[styles.card, {backgroundColor: colors.surface}]}
            onPress={() => {
              if (canEdit) {
                navigation.navigate('GestionForm', {gestion: item});
              }
            }}
            onLongPress={() => {
              if (canDel) {
                handleDelete(item);
              }
            }}
            activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <Text style={[styles.year, {color: colors.primary}]}>
                {item.year}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.estado === 'activo'
                        ? colors.primaryBg
                        : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        item.estado === 'activo'
                          ? colors.primaryDark
                          : colors.textSecondary,
                    },
                  ]}>
                  {item.estado === 'activo' ? 'Activo' : 'Cerrado'}
                </Text>
              </View>
            </View>
            <Text style={[styles.titulo, {color: colors.textPrimary}]}>
              {item.titulo}
            </Text>
            {item.descripcion ? (
              <Text
                style={[styles.desc, {color: colors.textSecondary}]}
                numberOfLines={2}>
                {item.descripcion}
              </Text>
            ) : null}
            <View style={styles.countRow}>
              <Text style={[styles.countIcon]}>👥</Text>
              <Text style={[styles.countText, {color: colors.textSecondary}]}>
                {counts[item.id] ?? 0} funcionarios
              </Text>
            </View>
          </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              No hay gestiones registradas
            </Text>
          </View>
        }
      />

      {can(user?.permissions, 'gestiones', 'create') && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() =>
              navigation.navigate('GestionForm', {gestion: null})
            }>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
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
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  year: {
    fontSize: 20,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  countIcon: {
    fontSize: 14,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
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
