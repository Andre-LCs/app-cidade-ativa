import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { apiRequest } from '../services/api';
import { uploadImagem } from '../services/cloudinary';
import * as tokenStorage from '../services/tokenStorage';

// Mesmas cores oficiais usadas em Login, Cadastro e Perfil
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

type Categoria = { id: number; nome: string; descricao: string | null };
type Coords = { latitude: number; longitude: number };
type StatusMessage = { tipo: 'sucesso' | 'erro'; texto: string };

function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((_, rejeitar) => setTimeout(() => rejeitar(new Error('timeout')), ms)),
  ]);
}

function textoDoErro(error: any) {
  const semConexao =
    !error?.message ||
    error.message === 'Failed to fetch' ||
    error.message === 'Network request failed';
  return semConexao ? 'Não foi possível realizar a conexão com o servidor.' : error.message;
}

export default function NovaOcorrencia() {
  const isWeb = Platform.OS === 'web';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  // Fallback: se o GPS/navegador falhar, o usuário pode informar as coordenadas manualmente
  const [modoManual, setModoManual] = useState(false);
  const [latTexto, setLatTexto] = useState('-15.7801');
  const [lonTexto, setLonTexto] = useState('-47.9292');

  const [isTituloFocused, setIsTituloFocused] = useState(false);
  const [isDescricaoFocused, setIsDescricaoFocused] = useState(false);

  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  useEffect(() => {
    carregarCategorias();
    obterLocalizacao();
  }, []);

  const sessaoExpirada = async () => {
    await tokenStorage.deleteItem('token');
    await tokenStorage.deleteItem('usuario');
    router.replace('/login');
  };

  const carregarCategorias = async () => {
    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const data = await apiRequest('/categorias', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategorias(data);
    } catch (error: any) {
      if (error.message === 'não autorizado') {
        await sessaoExpirada();
        return;
      }
      setStatusMessage({ tipo: 'erro', texto: textoDoErro(error) });
    } finally {
      setCarregandoCategorias(false);
    }
  };

  const obterLocalizacao = async () => {
    setBuscandoLocal(true);
    setLocalMsg(null);

    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== 'granted') {
        setLocalMsg('Permissão de localização negada. Ative nas configurações do aparelho ou do navegador.');
        setModoManual(true);
        return;
      }

      const posicao = await comTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        20000
      );
      setCoords({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
      setModoManual(false);
    } catch {
      setLocalMsg('Não foi possível obter a localização. Verifique se o GPS está ligado e tente de novo.');
      setModoManual(true);
    } finally {
      setBuscandoLocal(false);
    }
  };

  const tirarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      setStatusMessage({ tipo: 'erro', texto: 'Permissão da câmera negada. Ative nas configurações do aparelho.' });
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!resultado.canceled) {
      setFotoUri(resultado.assets[0].uri);
    }
  };

  const escolherDaGaleria = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!resultado.canceled) {
      setFotoUri(resultado.assets[0].uri);
    }
  };

  const registrar = async () => {
    setStatusMessage(null);

    if (categoriaId === null) {
      setStatusMessage({ tipo: 'erro', texto: 'Escolha uma categoria.' });
      return;
    }
    if (!titulo.trim()) {
      setStatusMessage({ tipo: 'erro', texto: 'Informe um título para a ocorrência.' });
      return;
    }

    // Usa o GPS quando disponível; senão, as coordenadas digitadas manualmente
    let local: Coords | null = coords;
    if (!local && modoManual) {
      const lat = parseFloat(latTexto.trim().replace(',', '.'));
      const lon = parseFloat(lonTexto.trim().replace(',', '.'));
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setStatusMessage({ tipo: 'erro', texto: 'Latitude ou longitude inválida.' });
        return;
      }
      local = { latitude: lat, longitude: lon };
    }
    if (!local) {
      setStatusMessage({ tipo: 'erro', texto: 'Aguarde a localização ou toque em "Tentar de novo".' });
      return;
    }

    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    setEnviando(true);

    try {
      let fotoUrl: string | undefined;

      if (fotoUri) {
        try {
          fotoUrl = await uploadImagem(fotoUri);
        } catch {
          setStatusMessage({
            tipo: 'erro',
            texto: 'Não foi possível enviar a foto. Tente novamente ou remova a foto para registrar sem ela.',
          });
          return;
        }
      }

      await apiRequest('/ocorrencias', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          categoria_id: categoriaId,
          titulo: titulo.trim(),
          descricao: descricao.trim() || undefined,
          foto_url: fotoUrl,
          latitude: local.latitude,
          longitude: local.longitude,
        }),
      });

      setConcluido(true);
      setStatusMessage({ tipo: 'sucesso', texto: 'Ocorrência registrada com sucesso!' });
      setTimeout(() => router.replace('/minhas-ocorrencias'), 1200);
    } catch (error: any) {
      if (error.message === 'não autorizado') {
        await sessaoExpirada();
        return;
      }
      setStatusMessage({ tipo: 'erro', texto: textoDoErro(error) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'Nova ocorrência' }} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Registrar ocorrência</Text>
            <Text style={styles.subtitle}>Descreva o problema e marque onde ele está</Text>
          </View>

          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                statusMessage.tipo === 'sucesso' ? styles.statusBannerSuccess : styles.statusBannerError,
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
                  statusMessage.tipo === 'sucesso' ? styles.statusTextSuccess : styles.statusTextError,
                ]}
              >
                {statusMessage.texto}
              </Text>
            </View>
          )}

          {/* Categoria */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            {carregandoCategorias ? (
              <ActivityIndicator color={COLORS.primaryBlue} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <View style={styles.chips}>
                {categorias.map((c) => {
                  const selecionada = c.id === categoriaId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.8}
                      onPress={() => setCategoriaId(c.id)}
                      style={[styles.chip, selecionada && styles.chipSelecionada]}
                    >
                      <Text style={[styles.chipTexto, selecionada && styles.chipTextoSelecionada]}>{c.nome}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título</Text>
            <View style={[styles.inputWrapper, isTituloFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="create-outline"
                size={18}
                color={isTituloFocused ? COLORS.primaryBlue : COLORS.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ex.: Buraco grande na via"
                placeholderTextColor={COLORS.placeholder}
                value={titulo}
                onChangeText={setTitulo}
                onFocus={() => setIsTituloFocused(true)}
                onBlur={() => setIsTituloFocused(false)}
              />
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperMultiline, isDescricaoFocused && styles.inputWrapperFocused]}>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Onde fica, tamanho, risco para quem passa..."
                placeholderTextColor={COLORS.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={descricao}
                onChangeText={setDescricao}
                onFocus={() => setIsDescricaoFocused(true)}
                onBlur={() => setIsDescricaoFocused(false)}
              />
            </View>
          </View>

          {/* Foto */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Foto (opcional)</Text>
            {fotoUri ? (
              <View>
                <Image source={{ uri: fotoUri }} style={styles.preview} resizeMode="cover" />
                <TouchableOpacity style={styles.removerFoto} activeOpacity={0.7} onPress={() => setFotoUri(null)}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  <Text style={styles.removerFotoTexto}>Remover foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fotoBotoes}>
                {!isWeb && (
                  <TouchableOpacity style={styles.botaoSecundario} activeOpacity={0.8} onPress={tirarFoto}>
                    <Ionicons name="camera-outline" size={18} color={COLORS.primaryBlue} />
                    <Text style={styles.botaoSecundarioTexto}>Tirar foto</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.botaoSecundario} activeOpacity={0.8} onPress={escolherDaGaleria}>
                  <Ionicons name="images-outline" size={18} color={COLORS.primaryBlue} />
                  <Text style={styles.botaoSecundarioTexto}>{isWeb ? 'Escolher foto' : 'Galeria'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Localização */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Localização</Text>
            <View style={styles.localBox}>
              <Ionicons
                name={coords ? 'location' : 'location-outline'}
                size={20}
                color={coords ? COLORS.primaryGreen : COLORS.textSecondary}
              />
              <Text style={styles.localTexto}>
                {buscandoLocal
                  ? 'Obtendo localização...'
                  : coords
                  ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                  : localMsg ?? 'Localização indisponível.'}
              </Text>
              <TouchableOpacity onPress={obterLocalizacao} disabled={buscandoLocal} activeOpacity={0.7}>
                <Text style={styles.linkTexto}>{coords ? 'Atualizar' : 'Tentar de novo'}</Text>
              </TouchableOpacity>
            </View>

            {modoManual && !coords && (
              <View style={styles.manualBox}>
                <Text style={styles.manualAviso}>
                  Sem GPS? Informe as coordenadas manualmente (padrão: Brasília).
                </Text>
                <View style={styles.manualLinha}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Latitude"
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType="numbers-and-punctuation"
                    value={latTexto}
                    onChangeText={setLatTexto}
                  />
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Longitude"
                    placeholderTextColor={COLORS.placeholder}
                    keyboardType="numbers-and-punctuation"
                    value={lonTexto}
                    onChangeText={setLonTexto}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Botão registrar */}
          <TouchableOpacity
            style={[styles.primaryButton, (enviando || concluido) && { opacity: 0.7 }]}
            onPress={registrar}
            activeOpacity={0.8}
            disabled={enviando || concluido}
          >
            {enviando ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Registrar ocorrência</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16 },
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
  headerContainer: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.primaryBlue, marginBottom: 2 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary },
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
  statusTextSuccess: { color: COLORS.primaryGreen },
  statusTextError: { color: COLORS.error },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: COLORS.inputBackground,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelecionada: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  chipTexto: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  chipTextoSelecionada: { color: COLORS.white },
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
  inputWrapperMultiline: { height: 90, alignItems: 'flex-start', paddingVertical: 8 },
  inputWrapperFocused: { borderColor: COLORS.primaryBlue, backgroundColor: COLORS.white },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, height: '100%' },
  inputMultiline: { width: '100%' },
  fotoBotoes: { flexDirection: 'row', gap: 10 },
  botaoSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
    backgroundColor: COLORS.white,
  },
  botaoSecundarioTexto: { color: COLORS.primaryBlue, fontSize: 14, fontWeight: '700' },
  preview: { width: '100%', height: 200, borderRadius: 10, backgroundColor: COLORS.inputBackground },
  removerFoto: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 8 },
  removerFotoTexto: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  localBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  localTexto: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  manualBox: { marginTop: 8 },
  manualAviso: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  manualLinha: { flexDirection: 'row', gap: 10 },
  manualInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  linkTexto: { color: COLORS.primaryGreen, fontSize: 13, fontWeight: '700' },
  primaryButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});