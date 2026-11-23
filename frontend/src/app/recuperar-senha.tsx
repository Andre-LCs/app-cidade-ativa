import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { API_URL } from '../services/api';
import { useTheme, type Paleta } from '../theme';
import FundoHorizonte from '../components/ui/FundoHorizonte';


function showAlert(title: string, message: string, onOk?: () => void) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
}

async function chamarApi(endpoint: string, corpo: object) {
  const resposta = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro na requisição');
  }
  return dados;
}

export default function RecuperarSenha() {
  const { colors: COLORS, escuro } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  // etapa 1: pedir o código por e-mail; etapa 2: informar o código e a nova senha
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const pedirCodigo = async () => {
    if (!email.trim()) {
      showAlert('Atenção', 'Informe o e-mail da sua conta.');
      return;
    }
    setCarregando(true);
    try {
      await chamarApi('/recuperar-senha', { email: email.trim() });
      setEtapa(2);
      showAlert(
        'Verifique seu e-mail',
        'Se o e-mail estiver cadastrado, enviamos um código de 6 dígitos. Ele vale por 15 minutos. Confira também a caixa de spam.'
      );
    } catch (erro: any) {
      showAlert('Erro', erro.message || 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const redefinir = async () => {
    if (!codigo.trim() || !novaSenha || !confirmar) {
      showAlert('Atenção', 'Preencha o código e a nova senha.');
      return;
    }
    if (novaSenha.length < 6) {
      showAlert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      showAlert('Atenção', 'As senhas não conferem.');
      return;
    }
    setCarregando(true);
    try {
      await chamarApi('/redefinir-senha', {
        email: email.trim(),
        codigo: codigo.trim(),
        nova_senha: novaSenha,
      });
      showAlert('Pronto!', 'Senha alterada. Entre com a nova senha.', () =>
        router.replace('/login')
      );
    } catch (erro: any) {
      showAlert('Não foi possível redefinir', erro.message || 'Erro de conexão.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FundoHorizonte />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>
            {etapa === 1 ? 'Esqueceu a senha?' : 'Redefinir senha'}
          </Text>
          <Text style={styles.subtitle}>
            {etapa === 1
              ? 'Informe o e-mail da sua conta e enviaremos um código de 6 dígitos.'
              : `Digite o código enviado para ${email.trim()} e escolha a nova senha.`}
          </Text>

          {etapa === 1 ? (
            <>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="exemplo@email.com"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, carregando && { opacity: 0.7 }]}
                onPress={pedirCodigo}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Enviar código</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.link} onPress={() => setEtapa(2)} activeOpacity={0.7}>
                <Text style={styles.linkText}>Já tenho um código</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Código de 6 dígitos</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="keypad-outline" size={18} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={codigo}
                  onChangeText={setCodigo}
                />
              </View>

              <Text style={styles.label}>Nova senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo de 6 caracteres"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!senhaVisivel}
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                />
                <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)} activeOpacity={0.7}>
                  <Ionicons
                    name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirmar nova senha</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!senhaVisivel}
                  value={confirmar}
                  onChangeText={setConfirmar}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, carregando && { opacity: 0.7 }]}
                onPress={redefinir}
                disabled={carregando}
                activeOpacity={0.8}
              >
                {carregando ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>Redefinir senha</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.link} onPress={pedirCodigo} disabled={carregando} activeOpacity={0.7}>
                <Text style={styles.linkText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.voltar} onPress={() => router.replace('/login')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (COLORS: Paleta) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 36 },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.textAccent, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4, marginTop: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 6,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, height: '100%' },
  button: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  link: { alignSelf: 'center', marginTop: 14 },
  linkText: { color: COLORS.textGreen, fontSize: 13, fontWeight: '700' },
  voltar: { alignSelf: 'center', marginTop: 18 },
});
