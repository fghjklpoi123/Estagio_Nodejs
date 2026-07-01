import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

// Recria "table.striped" de front/planoFront/plano.css: cabeçalho em
// maiúsculas, linhas zebradas e coluna final de ações (editar/excluir).
// Colunas largas usam scroll horizontal, já que <table> não existe em RN.
export default function StripedTable({ columns, data, keyExtractor, onEdit, onDelete, emptyText = 'Nenhum registro encontrado' }) {
  const styles = makeStyles();
  if (!data.length) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <Text key={col.key} style={[styles.th, { width: col.width || 120 }]}>{col.label}</Text>
          ))}
          <Text style={[styles.th, styles.actionsCell]}>AÇÕES</Text>
        </View>
        {data.map((item, i) => (
          <View key={keyExtractor(item)} style={[styles.row, i % 2 === 0 && styles.rowOdd]}>
            {columns.map((col) => (
              <Text key={col.key} style={[styles.td, { width: col.width || 120 }]} numberOfLines={2}>
                {col.render ? col.render(item) : String(item[col.key] ?? '')}
              </Text>
            ))}
            <View style={[styles.actionsCell, styles.actionsRow]}>
              <Pressable onPress={() => onEdit(item)} style={styles.actionBtn}>
                <Ionicons name="pencil" size={16} color={colors.blue600} />
              </Pressable>
              <Pressable onPress={() => onDelete(item)} style={styles.actionBtn}>
                <Ionicons name="trash" size={16} color={colors.deleteBtn} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = () => StyleSheet.create({
  empty: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  th: {
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  rowOdd: {
    backgroundColor: '#f9f9f9',
  },
  td: {
    fontSize: 13,
    color: colors.textDark,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  actionsCell: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
});
