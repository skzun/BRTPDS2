import { useContext, useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View, TurboModuleRegistry, UIManager } from 'react-native';
import { Pressable } from './ActionPressable';

import { STATUS_LABELS } from '../constants/status';
import { ThemeContext } from '../styles/theme';
import { FieldScrollContext } from './KeyboardScrollView';

export function StatusBadge({ status }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  return <Text style={[themeStyles.badge, themeStyles[`badge${status}`]]}>{STATUS_LABELS[status] || status}</Text>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, autoCapitalize, multiline = false, maxLength, editable = true, accessibilityLabel, error }) {
  const { isDark, styles: themeStyles } = useContext(ThemeContext);
  const inputRef = useRef(null);
  const revealInput = useContext(FieldScrollContext);
  const lastText = useRef(String(value ?? ''));
  useEffect(() => { const text = String(value ?? ''); if (text !== lastText.current) { inputRef.current?.setNativeProps({ text }); lastText.current = text; } }, [value]);
  const resolvedAutoCapitalize = autoCapitalize || (secureTextEntry || keyboardType === 'email-address' ? 'none' : 'sentences');
  return (
    <View style={themeStyles.field}>
      <Text style={themeStyles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel || label}
        ref={inputRef}
        defaultValue={String(value ?? '')}
        onChangeText={text => { lastText.current = text; onChangeText?.(text); }}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={resolvedAutoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable}
        onFocus={() => revealInput(inputRef.current)}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[themeStyles.input, multiline && { minHeight: 100 }]}
      />
      {!!error && <Text accessibilityRole="alert" style={{ color: isDark ? '#FDA4AF' : '#B91C1C', marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

export function DateTimeField({ label, value, onChangeText, editable = true, error, dateOnly = false }) {
  const { styles: themeStyles } = useContext(ThemeContext);
  const [pickerMode, setPickerMode] = useState(null);
  const hasPicker = Platform.OS === 'android' ? !!TurboModuleRegistry.get('RNCDatePicker') : Platform.OS === 'ios' && !!UIManager.getViewManagerConfig('RNDateTimePicker');
  const NativePicker = hasPicker ? require('@react-native-community/datetimepicker').default : null;
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
      {NativePicker && editable && <View style={themeStyles.actionRow}>
        <Pressable style={themeStyles.smallButton} onPress={() => setPickerMode('date')}><Text style={themeStyles.smallButtonText}>Escolher data</Text></Pressable>
        {!dateOnly && <Pressable style={themeStyles.smallButton} onPress={() => setPickerMode('time')}><Text style={themeStyles.smallButtonText}>Escolher horário</Text></Pressable>}
      </View>}
      {NativePicker && pickerMode && <NativePicker mode={pickerMode} value={(() => { const [d,m,y] = date.split('/').map(Number); const [h,min] = time.split(':').map(Number); const candidate = new Date(y || new Date().getFullYear(), (m || 1)-1, d || 1, h || 0, min || 0); return Number.isNaN(candidate.getTime()) ? new Date() : candidate; })()} onChange={(event, selected) => {
        setPickerMode(null); if (!selected) return;
        const pad = n => String(n).padStart(2,'0');
        onChangeText(`${pad(selected.getDate())}/${pad(selected.getMonth()+1)}/${selected.getFullYear()} ${pad(selected.getHours())}:${pad(selected.getMinutes())}`);
      }} />}
      <View style={themeStyles.dateTimeRow}>
        <View style={themeStyles.dateTimeColumn}>
          <Field label="Data" accessibilityLabel={`${label}: data`} value={date}
            onChangeText={(text) => onChangeText(`${formatDateInput(text)} ${dateOnly ? '00:00' : time}`)}
            placeholder="DD/MM/AAAA" keyboardType="number-pad" autoCapitalize="none" maxLength={10} editable={editable} />
        </View>
        {!dateOnly && <View style={themeStyles.dateTimeColumn}>
          <Field label="Horário" accessibilityLabel={`${label}: horário`} value={time}
            onChangeText={(text) => onChangeText(`${date} ${formatTimeInput(text)}`)}
            placeholder="HH:mm" keyboardType="number-pad" autoCapitalize="none" maxLength={5} editable={editable} />
        </View>}
      </View>
      {!!error && <Text accessibilityRole="alert" style={themeStyles.hint}>{error}</Text>}
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
