import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as tokenStorage from '../services/tokenStorage';
import { API_URL } from '../services/api';
import BotaoTema from '../components/ui/BotaoTema';
import { useAvisos } from '../components/ui/Avisos';
import { useTheme, type Paleta } from '../theme';



export default function Login() {
  const { colors: COLORS, escuro } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const { toast } = useAvisos();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast('E-mail e senha são obrigatórios.', 'erro');
      return;
    }

    setIsLoading(true);

    try {
      // O endereço da API vem de EXPO_PUBLIC_API_URL (frontend/.env).
      // No celular (Expo Go), use o IP da máquina na rede local.
      const apiUrl = `${API_URL}/login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, senha: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // HTTP 200 - Login com sucesso!
        await tokenStorage.setItem('token', data.token);
        await tokenStorage.setItem('usuario', JSON.stringify(data.usuario));
        console.log('Token salvo com sucesso.');

        toast(`Bem-vindo(a), ${data.usuario.nome}!`, 'sucesso');
        router.replace('/minhas-ocorrencias');
        

      } else {
        // HTTP 400 ou 401 - Erro tratado pelo backend
        toast(data.erro || 'Não foi possível entrar.', 'erro');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      toast('Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.', 'erro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBlue} />

      <BotaoTema style={[styles.botaoTema, { top: insets.top + 10 }]} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Faixa de marca */}
        <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
          <View style={styles.skyline} pointerEvents="none">
            {[44, 110, 70, 0, 96, 60, 120].map((h, i) =>
              h === 0 ? <View key={i} style={{ width: 40 }} /> : <View key={i} style={[styles.predio, { height: h }]} />
            )}
          </View>
          <View style={styles.logoCard}>
            <Image
              source={require('../../assets/images/logo-projeto.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroTitle}>Cuide da sua cidade</Text>
          <Text style={styles.heroSubtitle}>
            Registre problemas, valide com a comunidade e acompanhe cada solução.
          </Text>
        </View>

        {/* Folha branca com o formulário */}
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={isEmailFocused ? COLORS.primaryBlue : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={isPasswordFocused ? COLORS.primaryBlue : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
                accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            activeOpacity={0.7}
            onPress={() => router.push('/recuperar-senha')}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={() => router.push('/cadastro')}
          >
            <Text style={styles.registerButtonText}>Criar conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.explorar}
            activeOpacity={0.7}
            onPress={() => router.push('/mapa?visitante=1')}
          >
            <Ionicons name="map-outline" size={18} color={COLORS.textAccent} />
            <Text style={styles.explorarTexto}>Explorar o mapa sem conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (COLORS: Paleta) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBlue },
  scroll: { flexGrow: 1 },
  botaoTema: { position: 'absolute', right: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.onBlueTint, alignItems: 'center', justifyContent: 'center' },
  explorar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 18, paddingVertical: 8 },
  explorarTexto: { color: COLORS.textAccent, fontSize: 14, fontWeight: '700' },
  hero: {
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 56,
    overflow: 'hidden',
  },
  skyline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  predio: { width: 40, backgroundColor: 'rgba(255,255,255,0.07)' },
  logoCard: {
    width: 128,
    height: 128,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#081430',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: { width: 100, height: 100 },
  heroTitle: {
    marginTop: 20,
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.onBlueMuted,
    textAlign: 'center',
    maxWidth: 290,
  },
  sheet: {
    flexGrow: 1,
    marginTop: -28,
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperFocused: { borderColor: COLORS.borderFocused, backgroundColor: COLORS.cardBackground },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, height: '100%' },
  eyeIcon: { padding: 6 },
  forgotPasswordButton: { alignSelf: 'flex-end', marginBottom: 18, paddingVertical: 4 },
  forgotPasswordText: { color: COLORS.textAccent, fontSize: 13, fontWeight: '700' },
  loginButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  loginButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  registerButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryGreen,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: { color: COLORS.textGreen, fontSize: 16, fontWeight: '700' },
});
