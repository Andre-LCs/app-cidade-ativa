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
import { Stack, router } from 'expo-router';
import { apiRequest } from '../services/api';
import * as tokenStorage from '../services/tokenStorage';
import { COLORS, iniciais } from '../theme';


type StatusMessage = {
  tipo: 'sucesso' | 'erro';
  texto: string;
};

export default function Perfil() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [nomeExibido, setNomeExibido] = useState('');
  const [emailExibido, setEmailExibido] = useState('');

  const [isNomeFocused, setIsNomeFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [isExcluindo, setIsExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

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
      setNomeExibido(data.nome);
      setEmailExibido(data.email);
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

      setNomeExibido(nome.trim());
      setEmailExibido(email.trim());
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

  const excluirConta = async () => {
    setIsExcluindo(true);
    setErroExclusao('');

    try {
      const token = await tokenStorage.getItem('token');

      await apiRequest('/usuario/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senha: senhaExclusao }),
      });

      await tokenStorage.deleteItem('token');
      await tokenStorage.deleteItem('usuario');
      Alert.alert('Conta excluída', 'Seus dados pessoais foram apagados.');
      router.replace('/login');
    } catch (error: any) {
      const semConexao =
        !error.message ||
        error.message === 'Failed to fetch' ||
        error.message === 'Network request failed';

      setErroExclusao(
        semConexao ? 'Não foi possível realizar a conexão com o servidor.' : error.message
      );
    } finally {
      setIsExcluindo(false);
    }
  };

  // Segunda confirmação antes de excluir de fato
  const handleExcluirConta = () => {
    setErroExclusao('');

    if (!senhaExclusao) {
      setErroExclusao('Digite sua senha para confirmar.');
      return;
    }

    Alert.alert(
      'Excluir conta?',
      'Essa ação não pode ser desfeita. Seu nome, e-mail e senha serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: excluirConta },
      ]
    );
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
      <Stack.Screen options={{ title: 'Perfil' }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBlue} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.faixa}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIniciais}>{iniciais(nomeExibido)}</Text>
          </View>
          <Text style={styles.faixaNome} numberOfLines={1}>{nomeExibido}</Text>
          <Text style={styles.faixaEmail} numberOfLines={1}>{emailExibido}</Text>
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

          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={() => router.replace('/minhas-ocorrencias')}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        {/* Excluir conta */}
        {!mostrarExclusao ? (
          <TouchableOpacity
            style={styles.deleteLink}
            activeOpacity={0.7}
            onPress={() => setMostrarExclusao(true)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteLinkText}>Excluir minha conta</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Excluir minha conta</Text>
            <Text style={styles.deleteText}>
              Seu nome, e-mail e senha serão apagados e você não poderá mais entrar. As
              ocorrências que você registrou continuam no mapa, sem identificar você.
            </Text>

            {!!erroExclusao && <Text style={styles.deleteError}>{erroExclusao}</Text>}

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite sua senha para confirmar"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry
                autoCapitalize="none"
                value={senhaExclusao}
                onChangeText={setSenhaExclusao}
              />
            </View>

            <TouchableOpacity
              style={[styles.deleteButton, isExcluindo && { opacity: 0.7 }]}
              activeOpacity={0.8}
              disabled={isExcluindo}
              onPress={handleExcluirConta}
            >
              {isExcluindo ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Excluir definitivamente</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.7}
              onPress={() => { setMostrarExclusao(false); setSenhaExclusao(''); setErroExclusao(''); }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { flexGrow: 1, paddingBottom: 24 },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.white,
    borderWidth: 4,
    borderColor: '#7FB8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIniciais: { fontSize: 28, fontWeight: '800', color: COLORS.primaryBlue },
  faixa: {
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 56,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  faixaNome: { marginTop: 10, fontSize: 20, fontWeight: '800', color: COLORS.white },
  faixaEmail: { fontSize: 13, color: COLORS.onBlueMuted, marginTop: 2 },
  card: {
    marginHorizontal: 20,
    marginTop: -32,
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
  deleteLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, gap: 6 },
  deleteLinkText: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  deleteCard: {
    marginTop: 16,
    backgroundColor: COLORS.errorBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    padding: 16,
    gap: 10,
  },
  deleteTitle: { fontSize: 15, fontWeight: '800', color: COLORS.error },
  deleteText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },
  deleteError: { fontSize: 13, fontWeight: '600', color: COLORS.error },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
});