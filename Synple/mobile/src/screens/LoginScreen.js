import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPhone } from '../services/formatters';
import { Choice, Field } from '../components/FormControls';
import { styles } from '../styles/theme';

export function LoginScreen({ onLogin, onRegister, onRecoverAccount, onResetPassword }) {
  const [tab, setTab] = useState('LOGIN');
  const [mode, setMode] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registration, setRegistration] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView style={styles.loginSurface}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/synple-splash.png')} style={styles.loginLogo} resizeMode="contain" />
        <Text style={styles.loginTitle}>Bem-vindo ao Synple</Text>
        <Text style={styles.loginSubtitle}>Acesse sua conta para continuar.</Text>
        <View style={styles.loginCard}>
          <View style={styles.loginModeRow}>
            <Choice label="Entrar" active={tab === 'LOGIN'} onPress={() => { setTab('LOGIN'); setForgotStep(1); }} />
            <Choice label="Criar conta" active={tab === 'REGISTER'} onPress={() => { setTab('REGISTER'); setForgotStep(1); }} />
          </View>

          {tab === 'LOGIN' && (
            <>
              <Text style={styles.cardTitle}>Entrar</Text>
              <Text style={styles.hint}>Selecione o tipo de acesso.</Text>
              <View style={styles.loginModeRow}>
                <Choice label="Admin. do sistema" active={mode === 'SYSTEM_ADMIN'} onPress={() => setMode('SYSTEM_ADMIN')} />
                <Choice label="Usuário" active={mode === 'USER'} onPress={() => setMode('USER')} />
              </View>
              <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" />
              <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry />
              <Pressable style={styles.forgotLink} onPress={() => { setTab('FORGOT'); setForgotEmail(email); setForgotStep(1); }}>
                <Text style={styles.forgotLinkText}>Esqueci minha senha</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => onLogin({ email, password, mode })}>
                <Text style={styles.primaryButtonText}>Entrar como {mode === 'SYSTEM_ADMIN' ? 'administrador do sistema' : 'usuário'}</Text>
              </Pressable>
            </>
          )}

          {tab === 'REGISTER' && (
            <>
              <Text style={styles.cardTitle}>Criar conta</Text>
              <Text style={styles.hint}>Informe seus dados para criar o acesso de usuário.</Text>
              <Field label="Nome completo" value={registration.name} onChangeText={(name) => setRegistration({ ...registration, name })} placeholder="Seu nome" />
              <Field label="E-mail" value={registration.email} onChangeText={(email) => setRegistration({ ...registration, email })} placeholder="voce@email.com" keyboardType="email-address" />
              <Field label="Telefone" value={registration.phone} onChangeText={(phone) => setRegistration({ ...registration, phone: formatPhone(phone) })} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
              <Field label="Senha" value={registration.password} onChangeText={(password) => setRegistration({ ...registration, password })} placeholder="Mínimo de 6 caracteres" secureTextEntry />
              <Field label="Confirmar senha" value={registration.confirmPassword} onChangeText={(confirmPassword) => setRegistration({ ...registration, confirmPassword })} placeholder="Repita a senha" secureTextEntry />
              <Pressable style={styles.primaryButton} onPress={() => onRegister(registration)}>
                <Text style={styles.primaryButtonText}>Criar conta</Text>
              </Pressable>
            </>
          )}

          {tab === 'FORGOT' && (
            <>
              <Text style={styles.cardTitle}>Recuperação de conta</Text>
              {forgotStep === 1 ? (
                <>
                  <Text style={styles.hint}>Informe seu e-mail cadastrado para enviarmos um link seguro de redefinição de senha.</Text>
                  <Field label="E-mail cadastrado" value={forgotEmail} onChangeText={setForgotEmail} placeholder="voce@email.com" keyboardType="email-address" />
                  <Pressable style={styles.primaryButton} onPress={() => {
                    const success = onRecoverAccount && onRecoverAccount(forgotEmail);
                    if (success) setForgotStep(2);
                  }}>
                    <Text style={styles.primaryButtonText}>Enviar link de recuperação</Text>
                  </Pressable>
                  <Pressable style={styles.cancelOutlineButton} onPress={() => setTab('LOGIN')}>
                    <Text style={styles.cancelOutlineText}>Voltar ao login</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.hint}>Link de recuperação validado para {forgotEmail}. Digite sua nova senha:</Text>
                  <Field label="Nova senha" value={newPassword} onChangeText={setNewPassword} placeholder="Mínimo de 6 caracteres" secureTextEntry />
                  <Field label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a nova senha" secureTextEntry />
                  <Pressable style={styles.primaryButton} onPress={() => {
                    const success = onResetPassword && onResetPassword(forgotEmail, newPassword, confirmPassword);
                    if (success) {
                      setEmail(forgotEmail);
                      setPassword(newPassword);
                      setTab('LOGIN');
                      setForgotStep(1);
                      setNewPassword('');
                      setConfirmPassword('');
                    }
                  }}>
                    <Text style={styles.primaryButtonText}>Redefinir senha e salvar</Text>
                  </Pressable>
                  <Pressable style={styles.cancelOutlineButton} onPress={() => { setForgotStep(1); setTab('LOGIN'); }}>
                    <Text style={styles.cancelOutlineText}>Cancelar</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
