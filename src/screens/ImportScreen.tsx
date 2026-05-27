import {useState} from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {pick, types} from '@react-native-documents/picker';
import * as XLSX from 'xlsx';
import {colors} from '../theme/colors';
import {importPersonas, limpiarPersonas} from '../database/personas';

type RowData = any[];

const CAMPOS = ['ci', 'nombre', 'cargo', 'dependencia', 'fecha_nacimiento'] as const;
const CAMPOS_REQUERIDOS = ['nombre', 'fecha_nacimiento'];
const CAMPOS_LABELS: Record<string, string> = {
  ci: 'CI',
  nombre: 'Nombre',
  cargo: 'Cargo',
  dependencia: 'Dependencia',
  fecha_nacimiento: 'Fecha de Nac.',
};

function formatearPreview(valor: any): string {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    const d = String(valor.getDate()).padStart(2, '0');
    const m = String(valor.getMonth() + 1).padStart(2, '0');
    const y = valor.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(valor ?? '').slice(0, 30);
}

function convertirFecha(raw: any): string {
  if (!raw) {
    return '';
  }

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(raw).trim();

  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const num = Number(str);
  if (!isNaN(num) && num > 10000 && num < 200000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const partes = str.split(/[/\-.]/);
  if (partes.length === 3) {
    if (partes[0].length === 4) {
      const m = partes[1].padStart(2, '0');
      const d = partes[2].padStart(2, '0');
      return `${partes[0]}-${m}-${d}`;
    }
    const d = partes[0].padStart(2, '0');
    const m = partes[1].padStart(2, '0');
    const y = partes[2].length === 2 ? '20' + partes[2] : partes[2];
    return `${y}-${m}-${d}`;
  }

  return str;
}

export default function ImportScreen({navigation}: any) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await pick({
        type: [types.xlsx, types.xls],
      });

      if (result.length === 0) {
        return;
      }

      const file = result[0];
      const response = await fetch(file.uri);
      const blob = await response.arrayBuffer();
      const workbook = XLSX.read(blob, {type: 'array', cellDates: true});
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, {header: 1, raw: true});

      if (data.length < 2) {
        Alert.alert('Error', 'El archivo debe tener al menos 2 filas (encabezados + datos)');
        return;
      }

      const fileHeaders = data[0].map(h => String(h).trim());
      const fileRows = data.slice(1).filter(r => r.some(c => String(c).trim()));

      setHeaders(fileHeaders);
      setRows(fileRows);

      const autoMapping: Record<string, string> = {};
      fileHeaders.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes('ci') || lower.includes('cedula') || lower.includes('cédula')) {
          autoMapping[i] = 'ci';
        } else if (lower.includes('nombre') || lower.includes('apellido')) {
          autoMapping[i] = 'nombre';
        } else if (lower.includes('cargo')) {
          autoMapping[i] = 'cargo';
        } else if (lower.includes('dependencia') || lower.includes('departamento')) {
          autoMapping[i] = 'dependencia';
        } else if (lower.includes('fecha') || lower.includes('nacimiento')) {
          autoMapping[i] = 'fecha_nacimiento';
        }
      });
      setMapping(autoMapping);
    } catch {
      Alert.alert('Error', 'No se pudo leer el archivo');
    }
  };

  const handleImport = async () => {
    const usedFields = new Set(Object.values(mapping));
    const missing = CAMPOS_REQUERIDOS.filter(c => !usedFields.has(c));
    if (missing.length > 0) {
      Alert.alert(
        'Faltan campos requeridos',
        `Debes mapear: ${missing.map(c => CAMPOS_LABELS[c]).join(', ')}`,
      );
      return;
    }

    setImporting(true);
    try {
      const personas = rows.map(row => {
        const persona: any = {};
        Object.entries(mapping).forEach(([colIdx, campo]) => {
          const raw = row[Number(colIdx)];
          persona[campo] = campo === 'fecha_nacimiento'
            ? convertirFecha(raw)
            : String(raw ?? '').trim();
        });
        return persona;
      });

      const count = await importPersonas(personas);
      Alert.alert('Importación exitosa', `Se importaron ${count} personas`, [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo leer el archivo');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar todos los datos',
      '¿Estás seguro? Se eliminarán todas las personas registradas.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await limpiarPersonas();
            Alert.alert('Listo', 'Todos los datos fueron eliminados');
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {headers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Importar desde Excel</Text>
          <Text style={styles.emptyDesc}>
            Selecciona un archivo .xlsx o .xls con los datos de personas
          </Text>
          <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile}>
            <Text style={styles.pickBtnText}>Seleccionar archivo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearAll}>
            <Text style={styles.clearBtnText}>Limpiar todos los datos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Mapeo de columnas</Text>
          <Text style={styles.sectionDesc}>
            Selecciona qué campo corresponde a cada columna del Excel
          </Text>

          {headers.map((header, colIdx) => (
            <TouchableOpacity
              key={colIdx}
              style={styles.mappingRow}
              onPress={() => setShowPicker(colIdx)}>
              <Text style={styles.colHeader}>{header}</Text>
              <Text style={styles.colArrow}>→</Text>
              <Text style={styles.colField}>
                {mapping[colIdx]
                  ? CAMPOS_LABELS[mapping[colIdx]]
                  : '— Ignorar —'}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Vista previa</Text>
          {rows.slice(0, 5).map((row, ri) => (
            <View key={ri} style={styles.previewRow}>
              {Object.entries(mapping).map(([colIdx, campo]) => (
                <Text key={campo} style={styles.previewCell}>
                  {campo}: {formatearPreview(row[Number(colIdx)])}
                </Text>
              ))}
            </View>
          ))}
          {rows.length > 5 && (
            <Text style={styles.moreText}>
              ...y {rows.length - 5} filas más
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={handlePickFile}>
              <Text style={styles.pickBtnText}>Cambiar archivo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importBtn, importing && styles.disabled]}
              onPress={handleImport}
              disabled={importing}>
              <Text style={styles.importBtnText}>
                {importing ? 'Importando...' : `Importar ${rows.length} personas`}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={showPicker !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Mapear: {showPicker !== null ? headers[showPicker] : ''}
            </Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                if (showPicker !== null) {
                  const newMapping = {...mapping};
                  delete newMapping[showPicker];
                  setMapping(newMapping);
                  setShowPicker(null);
                }
              }}>
              <Text style={styles.modalOptionText}>— Ignorar columna —</Text>
            </TouchableOpacity>
            {CAMPOS.map(campo => (
              <TouchableOpacity
                key={campo}
                style={styles.modalOption}
                onPress={() => {
                  if (showPicker !== null) {
                    const newMapping = {...mapping};
                    Object.entries(newMapping).forEach(([k, v]) => {
                      if (v === campo) delete newMapping[k];
                    });
                    newMapping[showPicker] = campo;
                    setMapping(newMapping);
                    setShowPicker(null);
                  }
                }}>
                <Text style={styles.modalOptionText}>
                  {CAMPOS_LABELS[campo]}
                  {Object.values(mapping).includes(campo) ? ' ✓' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPicker(null)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  pickBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pickBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  clearBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colHeader: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  colArrow: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  colField: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  previewRow: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewCell: {
    fontSize: 12,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  moreText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  importBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  importBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  disabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalCancel: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.primaryBg,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
