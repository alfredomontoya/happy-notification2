import {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {FiltroFecha, nombreMes} from '../utils/filtros';

interface Props {
  filtroActivo: FiltroFecha;
  onChange: (filtro: FiltroFecha) => void;
}

const chips: {key: FiltroFecha; label: string; icon: string}[] = [
  {key: 'todos', label: 'Todos', icon: '👥'},
  {key: 'hoy', label: 'Hoy', icon: '🎂'},
  {key: 'semana', label: 'Semana', icon: '📅'},
  {key: 'mes', label: 'Mes', icon: '📆'},
];

const MESES_ABR = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export default function FiltroChips({filtroActivo, onChange}: Props) {
  const {colors} = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const isMesEspecifico =
    typeof filtroActivo === 'string' && filtroActivo.startsWith('mes-');
  const mesNum = isMesEspecifico
    ? parseInt(filtroActivo.split('-')[1], 10)
    : 0;
  const pickerLabel = isMesEspecifico ? nombreMes(mesNum) : 'Elegir mes';

  const handleMesPress = (n: number) => {
    onChange(`mes-${n}` as FiltroFecha);
    setShowPicker(false);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scroll}>
        <View style={styles.row}>
          {chips.map(chip => {
            const activo = filtroActivo === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.chip,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                  activo && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  setShowPicker(false);
                  onChange(activo ? 'todos' : chip.key);
                }}>
                <Text style={styles.icon}>{chip.icon}</Text>
                <Text
                  style={[
                    styles.label,
                    {color: activo ? colors.white : colors.textPrimary},
                  ]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.chip,
              {backgroundColor: colors.surface, borderColor: colors.border},
              (showPicker || isMesEspecifico) && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setShowPicker(prev => !prev)}>
            <Text style={{fontSize: 14, marginRight: 6}}>📅</Text>
            <Text
              style={[
                styles.label,
                {
                  color:
                    showPicker || isMesEspecifico
                      ? colors.white
                      : colors.textPrimary,
                },
              ]}>
              {pickerLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showPicker && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.scroll}>
          <View style={styles.mesRow}>
            {MESES_ABR.map((mes, idx) => {
              const n = idx + 1;
              const activo = isMesEspecifico && mesNum === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.mesChip,
                    {backgroundColor: colors.surface, borderColor: colors.border},
                    activo && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleMesPress(n)}>
                  <Text
                    style={[
                      styles.mesLabel,
                      {color: activo ? colors.white : colors.textPrimary},
                    ]}>
                    {mes}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  mesRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  mesChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  mesLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});