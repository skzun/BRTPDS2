import { useContext } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { STATUS_LABELS } from '../constants/status';
import { ThemeContext } from '../styles/theme';

export function StatusBadge({ status }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  return <Text style={[themeStyles.badge, themeStyles[`badge${status}`]]}>{STATUS_LABELS[status] || status}</Text>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, autoCapitalize }) {
  const { isDark, styles: themeStyles } = useContext(ThemeContext);
  const resolvedAutoCapitalize = autoCapitalize || (secureTextEntry || keyboardType === 'email-address' ? 'none' : 'sentences');
  return (
    <View style={themeStyles.field}>
      <Text style={themeStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={resolvedAutoCapitalize}
        autoCorrect={false}
        style={themeStyles.input}
      />
    </View>
  );
}

export function Choice({ active, label, onPress }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  return (
    <Pressable onPress={onPress} style={[themeStyles.choice, active && themeStyles.choiceActive]}>
      <Text style={[themeStyles.choiceText, active && themeStyles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}
