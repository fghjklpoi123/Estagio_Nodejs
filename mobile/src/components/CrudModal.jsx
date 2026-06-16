import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

// Recria ".modal-overlay" + ".form-card.modal-card" + ".form-actions" de
// front/planoFront/plano.css — usado pelos modais de criar/editar em todas
// as páginas admin (Planos, Alunos, Treinadores, Modalidades).
export default function CrudModal({ visible, title, onClose, onSalvar, salvando, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>
            {children}
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onSalvar} disabled={salvando}>
                <Text style={styles.btnPrimaryTexto}>{salvando ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onClose} disabled={salvando}>
                <Text style={styles.btnSecondaryTexto}>Cancelar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  actions: {
    gap: 10,
    marginTop: 16,
  },
  btn: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.blue600,
  },
  btnPrimaryTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: colors.btnSecondaryBg,
  },
  btnSecondaryTexto: {
    color: colors.btnSecondaryTexto,
    fontWeight: '700',
    fontSize: 14,
  },
});
