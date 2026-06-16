import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

// Campos de formulário reaproveitados nos modais de cadastro/edição (Planos,
// Alunos, Treinadores, Modalidades), recriando ".form-card label/input/select"
// de front/planoFront/plano.css (mesmo padrão usado nas outras páginas admin).

export function FormField({ label, erro, children }) {
  return (
    <View style={styles.group}>
      <Text style={[styles.label, erro && styles.labelErro]}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField({ label, erro, style, ...props }) {
  return (
    <FormField label={label} erro={erro}>
      <TextInput
        style={[styles.input, erro && styles.inputErro, style]}
        placeholderTextColor="#9aa6b5"
        autoCorrect={false}
        {...props}
      />
    </FormField>
  );
}

export function TextAreaField({ label, erro, style, ...props }) {
  return (
    <FormField label={label} erro={erro}>
      <TextInput
        style={[styles.input, styles.textarea, erro && styles.inputErro, style]}
        placeholderTextColor="#9aa6b5"
        autoCorrect={false}
        multiline
        textAlignVertical="top"
        {...props}
      />
    </FormField>
  );
}

export function SelectField({ label, erro, value, onChange, options, placeholder = 'Nenhuma opção disponível' }) {
  return (
    <FormField label={label} erro={erro}>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const ativo = String(value) === String(opt.value);
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, ativo && styles.chipAtiva, erro && styles.inputErro]}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtiva]} numberOfLines={1}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        {options.length === 0 && <Text style={styles.chipVazio}>{placeholder}</Text>}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 10,
    gap: 6,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  labelErro: {
    color: colors.deleteBtn,
    fontWeight: '700',
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: '#fff',
    fontSize: 14,
    color: colors.textDark,
  },
  inputErro: {
    borderWidth: 1.8,
    borderColor: colors.deleteBtn,
    backgroundColor: '#fff5f5',
  },
  textarea: {
    minHeight: 60,
    maxHeight: 200,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: '#fff',
  },
  chipAtiva: {
    backgroundColor: colors.blue600,
    borderColor: colors.blue600,
  },
  chipTexto: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextoAtiva: {
    color: '#fff',
  },
  chipVazio: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
