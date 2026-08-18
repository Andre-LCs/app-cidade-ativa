import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primaryBlue: '#1F3F77',
  primaryGreen: '#32A041',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  inputBackground: '#F1F5F9',
  border: '#E2E8F0',
  borderFocused: '#1F3F77',
  white: '#FFFFFF',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = () => {
    console.log('Login solicitado com:', { email, password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.innerContainer}>
        
        {/* SEÇÃO DA LOGO (BEM MAIOR) */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo-projeto.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* CARD DO FORMULÁRIO */}
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Bem-vindo!</Text>
            <Text style={styles.subtitle}>Acesse sua conta no Cidade Ativa</Text>
          </View>

          {/* CAMPO DE E-MAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail ou Usuário</Text>
            <View 
              style={[
                styles.inputWrapper, 
                isEmailFocused && styles.inputWrapperFocused
              ]}
            >
              <Ionicons 
                name="mail-outline" 
                size={18} 
                color={isEmailFocused ? COLORS.primaryBlue : COLORS.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
                placeholderTextColor="#94A3B8"
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

          {/* CAMPO DE SENHA */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View 
              style={[
                styles.inputWrapper, 
                isPasswordFocused && styles.inputWrapperFocused
              ]}
            >
              <Ionicons 
                name="lock-closed-outline" 
                size={18} 
                color={isPasswordFocused ? COLORS.primaryBlue : COLORS.textSecondary} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="Sua senha"
                placeholderTextColor="#94A3B8"
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
              >
                <Ionicons 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={18} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ESQUECEU A SENHA */}
          <TouchableOpacity style={styles.forgotPasswordButton} activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          {/* BOTÃO DE ENTRAR */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* RODAPÉ */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Ainda não tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.registerButtonText}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 340, // Logo bem maior
    height: 170,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerContainer: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryBlue,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  inputWrapperFocused: {
    borderColor: COLORS.borderFocused,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: COLORS.primaryGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  registerButtonText: {
    color: COLORS.primaryGreen,
    fontSize: 13,
    fontWeight: '700',
  },
});