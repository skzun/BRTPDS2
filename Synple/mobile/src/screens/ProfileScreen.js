import { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Choice, Field } from '../components/FormControls';
import { formatPhone } from '../services/formatters';
import { ThemeContext } from '../styles/theme';

export function ProfileScreen({
  profileForm,
  setProfileForm,
  onUpdateProfile,
  passwordForm,
  setPasswordForm,
  onUpdatePassword,
  onRecoverAccount,
  activeUser,
  onSetTheme,
}) {
  const { styles } = useContext(ThemeContext);

  return (
    <>
      {/* 1. Dados Pessoais */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados pessoais</Text>
        <Field
          label="Nome"
          value={profileForm.name}
          onChangeText={(name) => setProfileForm({ ...profileForm, name })}
          placeholder="Seu nome"
        />
        <Field
          label="E-mail"
          value={profileForm.email}
          onChangeText={(email) => setProfileForm({ ...profileForm, email })}
          placeholder="voce@email.com"
          keyboardType="email-address"
        />
        <Field
          label="Telefone"
          value={profileForm.phone}
          onChangeText={(phone) => setProfileForm({ ...profileForm, phone: formatPhone(phone) })}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
        />
        <Pressable style={styles.primaryButton} onPress={onUpdateProfile}>
          <Text style={styles.primaryButtonText}>Salvar dados</Text>
        </Pressable>
      </View>

      {/* 2. Trocar Senha */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trocar senha</Text>
        <Field
          label="Senha atual"
          value={passwordForm.current}
          onChangeText={(current) => setPasswordForm({ ...passwordForm, current })}
          placeholder="Senha atual"
          secureTextEntry
        />
        <Field
          label="Nova senha"
          value={passwordForm.next}
          onChangeText={(next) => setPasswordForm({ ...passwordForm, next })}
          placeholder="Mínimo de 6 caracteres"
          secureTextEntry
        />
        <Field
          label="Confirmar nova senha"
          value={passwordForm.confirm}
          onChangeText={(confirm) => setPasswordForm({ ...passwordForm, confirm })}
          placeholder="Repita a nova senha"
          secureTextEntry
        />
        <Pressable style={styles.primaryButton} onPress={onUpdatePassword}>
          <Text style={styles.primaryButtonText}>Atualizar senha</Text>
        </Pressable>
        <Pressable style={styles.resetButton} onPress={onRecoverAccount}>
          <Text style={styles.resetText}>Recuperar conta por e-mail</Text>
        </Pressable>
      </View>

      {/* 3. Tema Preferido */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tema preferido</Text>
        <View style={styles.userChoices}>
          <Choice
            label="Claro"
            active={(activeUser?.theme || 'LIGHT') === 'LIGHT'}
            onPress={() => onSetTheme('LIGHT')}
          />
          <Choice
            label="Escuro"
            active={activeUser?.theme === 'DARK'}
            onPress={() => onSetTheme('DARK')}
          />
        </View>
      </View>
    </>
  );
}
