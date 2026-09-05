import { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { Choice, Field } from '../components/FormControls';
import { styles } from '../styles/theme';

export function LoginScreen({ onLogin, onRegister }) {
  const [tab, setTab] = useState('LOGIN');
  const [mode, setMode] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registration, setRegistration] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  return (
    <SafeAreaView style={styles.loginSurface}>
      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/synple-splash.png')} style={styles.loginLogo} resizeMode="contain" />
        <Text style={styles.loginTitle}>Bem-vindo ao Synple</Text>
        <Text style={styles.loginSubtitle}>Acesse sua conta para continuar.</Text>
        <View style={styles.loginCard}>
          <View style={styles.loginModeRow}>
            <Choice label="Entrar" active={tab === 'LOGIN'} onPress={() => setTab('LOGIN')} />
            <Choice label="Criar conta" active={tab === 'REGISTER'} onPress={() => setTab('REGISTER')} />
          </View>
          {tab === 'LOGIN' ? <>
            <Text style={styles.cardTitle}>Entrar</Text>
            <Text style={styles.hint}>Selecione o tipo de acesso.</Text>
            <View style={styles.loginModeRow}>
              <Choice label="Admin. da organização" active={mode === 'ADMIN'} onPress={() => setMode('ADMIN')} />
              <Choice label="Usuário" active={mode === 'USER'} onPress={() => setMode('USER')} />
            </View>
            <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@email.com" keyboardType="email-address" />
            <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry />
            <Pressable style={styles.primaryButton} onPress={() => onLogin({ email, password, mode })}>
              <Text style={styles.primaryButtonText}>Entrar como {mode === 'ADMIN' ? 'administrador' : 'usuário'}</Text>
            </Pressable>
          </> : <>
            <Text style={styles.cardTitle}>Criar conta</Text>
            <Text style={styles.hint}>Informe seus dados para criar o acesso de usuário.</Text>
            <Field label="Nome completo" value={registration.name} onChangeText={(name) => setRegistration({ ...registration, name })} placeholder="Seu nome" />
            <Field label="E-mail" value={registration.email} onChangeText={(email) => setRegistration({ ...registration, email })} placeholder="voce@email.com" keyboardType="email-address" />
            <Field label="Telefone" value={registration.phone} onChangeText={(phone) => setRegistration({ ...registration, phone })} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
            <Field label="Senha" value={registration.password} onChangeText={(password) => setRegistration({ ...registration, password })} placeholder="Mínimo de 6 caracteres" secureTextEntry />
            <Field label="Confirmar senha" value={registration.confirmPassword} onChangeText={(confirmPassword) => setRegistration({ ...registration, confirmPassword })} placeholder="Repita a senha" secureTextEntry />
            <Pressable style={styles.primaryButton} onPress={() => onRegister(registration)}><Text style={styles.primaryButtonText}>Criar conta</Text></Pressable>
          </>}
          <Text style={styles.loginNotice}>Neste protótipo, a senha será validada pelo backend quando ele for integrado.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
