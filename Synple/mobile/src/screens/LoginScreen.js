import { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Pressable } from '../components/ActionPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { formatPhone } from '../services/formatters';
import { Choice, Field } from '../components/FormControls';
import { styles } from '../styles/theme';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen({ onLogin, onGoogleLogin, onRegister, onRecoverAccount, onResetPassword }) {
  const [tab, setTab] = useState('LOGIN');
  const [mode, setMode] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registration, setRegistration] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const processedGoogleTokenRef = useRef(null);
  const googleClientIds = {
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };
  const googleWebClientId = googleClientIds.webClientId;
  const googleClientId = Platform.select({
    android: googleClientIds.androidClientId,
    ios: googleClientIds.iosClientId,
    default: googleClientIds.webClientId,
  });
  const googleRedirectUri = makeRedirectUri({ scheme: 'synple', path: 'oauthredirect' });
  // Expo Go cannot register the app's synple:// callback. SDK 57 resolves its
  // redirect to exp://... instead, which is not a valid native OAuth client
  // configuration for this app.
  const isExpoGo = googleRedirectUri.startsWith('exp://');
  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useIdTokenAuthRequest({
    ...googleClientIds,
    clientId: googleClientId || 'google-client-id-not-configured',
    redirectUri: googleRedirectUri,
    selectAccount: true,
  });
  const isGoogleConfigured = isValidGoogleClientId(googleWebClientId)
    && isValidGoogleClientId(googleClientId);

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'error') {
      Alert.alert('Login com Google', googleResponse.error?.message || 'O Google não concluiu a autenticação. Confira os Client IDs e a URI de retorno.');
      setIsGoogleSubmitting(false);
      return;
    }

    const idToken = googleResponse.params?.id_token || googleResponse.authentication?.idToken;
    if (!idToken) {
      if (googleResponse.type === 'opened') return;
      setIsGoogleSubmitting(false);
      return;
    }
    if (processedGoogleTokenRef.current === idToken) return;

    processedGoogleTokenRef.current = idToken;
    setIsGoogleSubmitting(true);
    Promise.resolve(onGoogleLogin(idToken)).finally(() => setIsGoogleSubmitting(false));
  }, [googleResponse, onGoogleLogin]);

  async function startGoogleLogin() {
    if (isExpoGo && Platform.OS !== 'web') {
      Alert.alert(
        'Build de desenvolvimento necessário',
        'O login Google nativo não funciona pelo Expo Go. Instale o build de desenvolvimento do Synple e abra o projeto nele.'
      );
      return;
    }
    if (!isGoogleConfigured) {
      Alert.alert(
        'Configuração do Google incompleta',
        'O app precisa do OAuth Client ID do tipo Web em EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, além do Client ID Android ou iOS.'
      );
      return;
    }
    setIsGoogleSubmitting(true);
    try {
      if (Platform.OS === 'web') {
        const result = await promptGoogleLogin();
        if (result.type === 'error') {
          Alert.alert('Login com Google', result.error?.message || 'O Google não concluiu a autenticação.');
          setIsGoogleSubmitting(false);
        } else if (result.type !== 'success' && result.type !== 'opened') {
          setIsGoogleSubmitting(false);
        }
        return;
      }

      const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        ...(Platform.OS === 'ios' ? { iosClientId: googleClientIds.iosClientId } : {}),
      });
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        setIsGoogleSubmitting(false);
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        throw new Error('O Google não retornou um ID token. Confira o OAuth Client ID do tipo Web.');
      }
      processedGoogleTokenRef.current = idToken;
      await Promise.resolve(onGoogleLogin(idToken)).finally(() => setIsGoogleSubmitting(false));
    } catch (error) {
      Alert.alert('Login com Google', error?.message || 'Não foi possível abrir a autenticação do Google.');
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.loginSurface}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <Image source={require('../../assets/synple-splash.png')} style={styles.loginLogo} resizeMode="contain" />
        <Text style={styles.loginTitle}>Bem-vindo ao Synple</Text>
        <Text style={styles.loginSubtitle}>Acesse sua conta para continuar.</Text>
        <View style={styles.loginCard}>
          <View style={styles.loginModeRow}>
            <Choice label="Entrar" active={tab === 'LOGIN'} onPress={() => { setTab('LOGIN'); setForgotStep(1); setResetCode(''); }} />
            <Choice label="Criar conta" active={tab === 'REGISTER'} onPress={() => { setTab('REGISTER'); setForgotStep(1); setResetCode(''); }} />
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
              <Pressable style={styles.forgotLink} onPress={() => { setTab('FORGOT'); setForgotEmail(email); setForgotStep(1); setResetCode(''); }}>
                <Text style={styles.forgotLinkText}>Esqueci minha senha</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => onLogin({ email, password, mode })}>
                <Text style={styles.primaryButtonText}>Entrar como {mode === 'SYSTEM_ADMIN' ? 'administrador do sistema' : 'usuário'}</Text>
              </Pressable>
              <GoogleLoginButton
                disabled={(Platform.OS === 'web' && !googleRequest) || !isGoogleConfigured || (isExpoGo && Platform.OS !== 'web') || isGoogleSubmitting}
                isLoading={isGoogleSubmitting}
                onPress={startGoogleLogin}
              />
              {(isExpoGo || !isGoogleConfigured) && <GoogleConfigurationHint isExpoGo={isExpoGo} />}
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
              <GoogleLoginButton
                disabled={(Platform.OS === 'web' && !googleRequest) || !isGoogleConfigured || (isExpoGo && Platform.OS !== 'web') || isGoogleSubmitting}
                isLoading={isGoogleSubmitting}
                onPress={startGoogleLogin}
              />
              {(isExpoGo || !isGoogleConfigured) && <GoogleConfigurationHint isExpoGo={isExpoGo} />}
            </>
          )}

          {tab === 'FORGOT' && (
            <>
              <Text style={styles.cardTitle}>Recuperação de conta</Text>
              {forgotStep === 1 ? (
                <>
                  <Text style={styles.hint}>
                    Informe o e-mail da sua conta. Enviaremos um código para você criar uma nova senha.
                  </Text>
                  <Field
                    label="E-mail cadastrado"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    placeholder="voce@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
                    disabled={isSubmitting}
                    onPress={async () => {
                      setIsSubmitting(true);
                      try {
                        const success = onRecoverAccount && await onRecoverAccount(forgotEmail);
                        if (success) setForgotStep(2);
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? 'Enviando código...' : 'Enviar código por e-mail'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.cancelOutlineButton} onPress={() => { setTab('LOGIN'); setForgotStep(1); }}>
                    <Text style={styles.cancelOutlineText}>Voltar ao login</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.hint}>
                    Se a conta existir, o código foi enviado para {forgotEmail}. Ele vale por 15 minutos. Digite-o para definir uma nova senha.
                  </Text>
                  <Field
                    label="Código recebido por e-mail"
                    value={resetCode}
                    onChangeText={setResetCode}
                    placeholder="Código de 6 dígitos"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <Field
                    label="Nova senha"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Mínimo de 6 caracteres"
                    secureTextEntry
                  />
                  <Field
                    label="Confirmar nova senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repita a nova senha"
                    secureTextEntry
                  />
                  <Pressable
                    style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
                    disabled={isSubmitting}
                    onPress={async () => {
                      setIsSubmitting(true);
                      try {
                        const success = onResetPassword && await onResetPassword(forgotEmail, resetCode, newPassword, confirmPassword);
                        if (success) {
                          setEmail(forgotEmail);
                          setPassword(newPassword);
                          setTab('LOGIN');
                          setForgotStep(1);
                          setResetCode('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.cancelOutlineButton} onPress={() => { setForgotStep(1); setResetCode(''); }}>
                    <Text style={styles.cancelOutlineText}>Solicitar outro código</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isValidGoogleClientId(clientId) {
  return typeof clientId === 'string'
    && /^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId)
    && !/seu-client|placeholder|your-client/i.test(clientId);
}

function GoogleConfigurationHint({ isExpoGo }) {
  return (
    <Text style={styles.hint}>
      {isExpoGo
        ? 'Para entrar com Google, instale o build de desenvolvimento do Synple. O Expo Go não inclui o módulo nativo de autenticação.'
        : 'Configure o OAuth Client ID do tipo Web e o Client ID desta plataforma em mobile/.env. Veja LOGIN_COM_GOOGLE.md.'}
    </Text>
  );
}

function GoogleLoginButton({ disabled, isLoading, onPress }) {
  return (
    <Pressable
      style={[styles.googleButton, disabled && styles.disabledButton]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: isLoading }}
    >
      <Text style={styles.googleButtonText}>
        {isLoading ? 'Confirmando conta Google...' : 'Continuar com Google'}
      </Text>
    </Pressable>
  );
}
