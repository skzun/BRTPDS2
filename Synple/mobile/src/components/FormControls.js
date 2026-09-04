import { Pressable, Text, TextInput, View } from 'react-native';

import { STATUS_LABELS } from '../constants/status';
import { styles } from '../styles/theme';

export function StatusBadge({ status }) {
  return <Text style={[styles.badge, styles[`badge${status}`]]}>{STATUS_LABELS[status] || status}</Text>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#94A3B8" keyboardType={keyboardType} secureTextEntry={secureTextEntry} style={styles.input} />
    </View>
  );
}

export function Choice({ active, label, onPress }) {
  return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text></Pressable>;
}
