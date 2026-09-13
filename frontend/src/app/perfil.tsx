import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiRequest } from '../services/api';
import * as tokenStorage from '../services/tokenStorage';

// DESIGN TOKENS (mesmas cores oficiais usadas em Login e Cadastro)
const COLORS = {
  primaryBlue: '#1F3F77',
  primaryGreen: '#32A041',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  inputBackground: '#F1F5F9',
  border: '#E2E8F0',
  borderCard: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  placeholder: '#94A3B8',
  white: '#FFFFFF',
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  errorBorder: '#FECACA',
  successBackground: '#F0FDF4',
  successBorder: '#BBF7D0',
};

type StatusMessage = {
  tipo: 'sucesso' | 'erro';
  texto: string;
};

export default function Perfil() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const [isNomeFocused, setIsNomeFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [isLoadingDados, setIsLoadingDados] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const token = await tokenStorage.getItem('token');

    if (!token) {
      // Sem token, não tem como estar aqui — manda pro login
      router.replace('/login');
      return;
    }

    try {
      const data = await apiRequest('/usuario/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNome(data.nome);
      setEmail(data.email);
    } catch (error: any) {
      // Token inválido/expirado — desloga e manda pro login
      await tokenStorage.deleteItem('token');
      await tokenStorage.deleteItem('usuario');
      router.replace('/login');
    } finally {
      setIsLoadingDados(false);
    }
  };

  const handleSalvar = async () => {
    setStatusMessage(null);

    if (!nome.trim() || !email.trim()) {
      setStatusMessage({ tipo: 'erro', texto: 'Nome e e-mail não podem ficar vazios.' });
      return;
    }

    setIsSaving(true);

    try {
      const token = await tokenStorage.getItem('token');

      await apiRequest('/usuario/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim() }),
      });

      setStatusMessage({ tipo: 'sucesso', texto: 'Dados atualizados com sucesso!' });
    } catch (error: any) {
      const semConexao =
        !error.message ||
        error.message === 'Failed to fetch' ||
        error.message === 'Network request failed';

      setStatusMessage({
        tipo: 'erro',
        texto: semConexao
          ? 'Não foi possível realizar a conexão com o servidor.'
          : error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSair = async () => {
    await tokenStorage.deleteItem('token');
    await tokenStorage.deleteItem('usuario');
    router.replace('/login');
  };

  if (isLoadingDados) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={COLORS.primaryBlue} />
          </View>
          <TouchableOpacity
            style={styles.avatarEditBadge}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Em breve', 'Troca de foto ainda não implementada.')}
          >
            <Ionicons name="camera" size={14} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Editar perfil</Text>
            <Text style={styles.subtitle}>Atualize suas informações</Text>
          </View>

          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                statusMessage.tipo === 'sucesso'
                  ? styles.statusBannerSuccess
                  : styles.statusBannerError,
              ]}
            >
              <Ionicons
                name={statusMessage.tipo === 'sucesso' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={18}
                color={statusMessage.tipo === 'sucesso' ? COLORS.primaryGreen : COLORS.error}
              />
              <Text
                style={[
                  styles.statusBannerText,
                  statusMessage.tipo === 'sucesso'
                    ? styles.statusBannerTextSuccess
                    : styles.statusBannerTextError,
                ]}
              >
                {statusMessage.texto}
              </Text>
            </View>
          )}

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <View style={[styles.inputWrapper, isNomeFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={isNomeFocused ? COLORS.primaryBlue : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                onFocus={() => setIsNomeFocused(true)}
                onBlur={() => setIsNomeFocused(false)}
              />
            </View>
          </View>

          {/* E-mail */}
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

          {/* Botão Salvar */}
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && { opacity: 0.7 }]}
            onPress={handleSalvar}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Salvar alterações</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={() => router.replace('/login')}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 16 },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E6F1FB',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryBlue,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerContainer: { marginBottom: 16, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.primaryBlue, marginBottom: 2 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '400' },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  statusBannerSuccess: { backgroundColor: COLORS.successBackground, borderColor: COLORS.successBorder },
  statusBannerError: { backgroundColor: COLORS.errorBackground, borderColor: COLORS.errorBorder },
  statusBannerText: { marginLeft: 8, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  statusBannerTextSuccess: { color: COLORS.primaryGreen },
  statusBannerTextError: { color: COLORS.error },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
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
  inputWrapperFocused: { borderColor: COLORS.primaryBlue, backgroundColor: COLORS.white },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, height: '100%' },
  primaryButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  cancelButton: { alignItems: 'center', marginTop: 12 },
  cancelButtonText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 6 },
  logoutText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
});
