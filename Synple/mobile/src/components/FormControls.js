import { useContext } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Pressable } from './ActionPressable';

import { STATUS_LABELS } from '../constants/status';
import { ThemeContext } from '../styles/theme';

export function StatusBadge({ status }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  return <Text style={[themeStyles.badge, themeStyles[`badge${status}`]]}>{STATUS_LABELS[status] || status}</Text>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, autoCapitalize, multiline = false, maxLength, editable = true, accessibilityLabel }) {
  const { isDark, styles: themeStyles } = useContext(ThemeContext);
  const resolvedAutoCapitalize = autoCapitalize || (secureTextEntry || keyboardType === 'email-address' ? 'none' : 'sentences');
  return (
    <View style={themeStyles.field}>
      <Text style={themeStyles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel || label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={resolvedAutoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[themeStyles.input, multiline && { minHeight: 100 }]}
      />
    </View>
  );
}

export function DateTimeField({ label, value, onChangeText, editable = true }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  const [date = '', time = ''] = String(value || '').split(' ');
  const formatDateInput = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
  };
  const formatTimeInput = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    return [digits.slice(0, 2), digits.slice(2, 4)].filter(Boolean).join(':');
  };
  return (
    <View style={themeStyles.field}>
      <Text style={themeStyles.label}>{label}</Text>
      <View style={themeStyles.dateTimeRow}>
        <View style={themeStyles.dateTimeColumn}>
          <Field label="Data" accessibilityLabel={`${label}: data`} value={date}
            onChangeText={(text) => onChangeText(`${formatDateInput(text)} ${time}`)}
            placeholder="DD/MM/AAAA" keyboardType="number-pad" autoCapitalize="none" maxLength={10} editable={editable} />
        </View>
        <View style={themeStyles.dateTimeColumn}>
          <Field label="Horário" accessibilityLabel={`${label}: horário`} value={time}
            onChangeText={(text) => onChangeText(`${date} ${formatTimeInput(text)}`)}
            placeholder="HH:mm" keyboardType="number-pad" autoCapitalize="none" maxLength={5} editable={editable} />
        </View>
      </View>
    </View>
  );
}

export function Choice({ active, label, onPress }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  return (
    <Pressable hitSlop={4} accessibilityRole="button" onPress={onPress} style={[themeStyles.choice, active && themeStyles.choiceActive]}>
      <Text style={[themeStyles.choiceText, active && themeStyles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}
