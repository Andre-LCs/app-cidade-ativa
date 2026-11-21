import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../services/api';
import * as tokenStorage from '../services/tokenStorage';
import { useAtualizacaoAutomatica } from '../services/atualizacaoAutomatica';

// Mesmas cores oficiais usadas em Login, Cadastro e Perfil
const COLORS = {
  primaryBlue: '#1F3F77',
  primaryGreen: '#32A041',
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  inputBackground: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  placeholder: '#94A3B8',
  white: '#FFFFFF',
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  errorBorder: '#FECACA',
};

type Ocorrencia = {
  id: number;
  categoria_nome: string;
  titulo: string;
  descricao: string | null;
  foto_url: string | null;
  status: string;
  criado_em: string;
  confirmacoes?: number;
  votos_resolvida?: number;
};

const STATUS: Record<string, { label: string; cor: string; fundo: string }> = {
  ABERTA: { label: 'Aberta', cor: '#1F3F77', fundo: '#E8EEF8' },
  EM_VALIDACAO: { label: 'Em validação', cor: '#B45309', fundo: '#FEF3C7' },
  VALIDADA: { label: 'Validada', cor: '#15803D', fundo: '#DCFCE7' },
  ENVIADA_PREFEITURA: { label: 'Enviada ao órgão responsável', cor: '#1F3F77', fundo: '#E8EEF8' },
  EM_ATENDIMENTO: { label: 'Em atendimento', cor: '#B45309', fundo: '#FEF3C7' },
  RESOLVIDA: { label: 'Resolvida', cor: '#15803D', fundo: '#DCFCE7' },
  EXPIRADA: { label: 'Expirada', cor: '#64748B', fundo: '#F1F5F9' },
  DUPLICADA: { label: 'Duplicada', cor: '#64748B', fundo: '#F1F5F9' },
};

// Pede ao Cloudinary uma versão pequena da foto (carrega mais rápido na lista).
function miniatura(url: string) {
  return url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_240,h_240,c_fill,q_auto,f_auto/')
    : url;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function MinhasOcorrencias() {
  const insets = useSafeAreaInsets();
  const [itens, setItens] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);

    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const data = await apiRequest('/ocorrencias?minhas=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItens(data);
    } catch (error: any) {
      if (error.message === 'não autorizado') {
        // sessão expirada: volta para o login
        await tokenStorage.deleteItem('token');
        await tokenStorage.deleteItem('usuario');
        router.replace('/login');
        return;
      }

      const semConexao =
        !error.message ||
        error.message === 'Failed to fetch' ||
        error.message === 'Network request failed';

      setErro(semConexao ? 'Não foi possível realizar a conexão com o servidor.' : error.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  // recarrega sempre que a tela volta a ficar em foco (ex.: depois de registrar uma nova)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // atualiza sozinha quando algo muda (voto de outra pessoa, mudança de status...)
  useAtualizacaoAutomatica(carregar);

  const aoPuxarParaAtualizar = () => {
    setAtualizando(true);
    carregar();
  };

  const cancelar = async (item: Ocorrencia) => {
    setErro(null);
    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      await apiRequest(`/ocorrencias/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItens((atual) => atual.filter((o) => o.id !== item.id));
    } catch (error: any) {
      setErro(error.message || 'Não foi possível cancelar a ocorrência.');
      carregar();
    }
  };

  const confirmarCancelamento = (item: Ocorrencia) => {
    const mensagem = 'A ocorrência deixará de aparecer na lista e no mapa. Esta ação não pode ser desfeita.';

    if (Platform.OS === 'web') {
      if (window.confirm(`Cancelar esta ocorrência?\n\n${mensagem}`)) cancelar(item);
      return;
    }

    Alert.alert('Cancelar esta ocorrência?', mensagem, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar ocorrência', style: 'destructive', onPress: () => cancelar(item) },
    ]);
  };

  const renderItem = ({ item }: { item: Ocorrencia }) => {
    const st = STATUS[item.status] ?? { label: item.status, cor: COLORS.textSecondary, fundo: COLORS.inputBackground };

    return (
      <View style={styles.card}>
        {item.foto_url ? (
          <Image source={{ uri: miniatura(item.foto_url) }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbVazio]}>
            <Ionicons name="image-outline" size={26} color={COLORS.placeholder} />
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.cardCategoria}>
            {item.categoria_nome}
            {(item.confirmacoes ?? 0) > 0
              ? ` • ${item.confirmacoes} ${item.confirmacoes === 1 ? 'confirmação' : 'confirmações'}`
              : ''}
          </Text>
          <View style={styles.cardRodape}>
            <View style={[styles.badge, { backgroundColor: st.fundo }]}>
              <Text style={[styles.badgeTexto, { color: st.cor }]}>{st.label}</Text>
            </View>
            <Text style={styles.cardData}>{formatarData(item.criado_em)}</Text>
          </View>
          {item.status === 'ABERTA' && (item.votos_resolvida ?? 0) === 0 && (
            <TouchableOpacity
              style={styles.cancelar}
              activeOpacity={0.7}
              onPress={() => confirmarCancelamento(item)}
              accessibilityLabel="Cancelar ocorrência"
            >
              <Ionicons name="close-circle-outline" size={15} color={COLORS.error} />
              <Text style={styles.cancelarTexto}>Cancelar ocorrência</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Minhas ocorrências',
          headerBackVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <TouchableOpacity onPress={() => router.push('/mapa')} accessibilityLabel="Abrir mapa de ocorrências">
                <Ionicons name="map-outline" size={26} color={COLORS.primaryBlue} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/perfil')} accessibilityLabel="Abrir perfil">
                <Ionicons name="person-circle-outline" size={28} color={COLORS.primaryBlue} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {erro && (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
          <Text style={styles.bannerTexto}>{erro}</Text>
        </View>
      )}

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          refreshing={atualizando}
          onRefresh={aoPuxarParaAtualizar}
          ListEmptyComponent={
            !erro ? (
              <View style={styles.vazio}>
                <Ionicons name="document-text-outline" size={48} color={COLORS.placeholder} />
                <Text style={styles.vazioTitulo}>Nenhuma ocorrência ainda</Text>
                <Text style={styles.vazioTexto}>
                  Viu um buraco, lâmpada queimada ou lixo acumulado? Registre pelo botão abaixo.
                </Text>
              </View>
            ) : null
          }
        />
      )}

        <View style={[styles.rodape, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => router.push('/nova-ocorrencia')}
        >
          <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Nova ocorrência</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBackground,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerTexto: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: COLORS.error, flexShrink: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: { width: 84, height: 84, borderRadius: 10 },
  thumbVazio: { backgroundColor: COLORS.inputBackground, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardCategoria: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cardRodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1 },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  cardData: { fontSize: 11, color: COLORS.placeholder, marginLeft: 8 },
  cancelar: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8 },
  cancelarTexto: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
  vazio: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 64 },
  vazioTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12 },
  vazioTexto: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  rodape: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});