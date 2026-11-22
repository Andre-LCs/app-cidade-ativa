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
import { COLORS, STATUS, categoriaVisual, primeiroNome } from '../theme';


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
  limite_validacao?: number;
  categoria_id?: number;
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
  const [nome, setNome] = useState('');

  const carregar = useCallback(async () => {
    setErro(null);

    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const salvo = await tokenStorage.getItem('usuario');
      if (salvo) {
        try { setNome(JSON.parse(salvo).nome ?? ''); } catch { /* ignora */ }
      }
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
    const cat = categoriaVisual(item.categoria_nome);
    const limite = item.limite_validacao ?? 3;
    const confirmacoes = item.confirmacoes ?? 0;
    const resolvida = item.status === 'RESOLVIDA';
    const encerrada = item.status === 'EXPIRADA' || item.status === 'DUPLICADA';
    // validação em curso: mostra x/limite; depois de validada (ou em andamento) a barra fica cheia
    const emValidacao = item.status === 'ABERTA' || item.status === 'EM_VALIDACAO';
    const progresso = resolvida || !emValidacao ? 1 : Math.min(confirmacoes, limite) / limite;

    return (
      <View style={styles.card}>
        {item.foto_url ? (
          <Image source={{ uri: miniatura(item.foto_url) }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: cat.fundo, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name={cat.icone} size={30} color={cat.cor} />
          </View>
        )}

        <View style={styles.cardInfo}>
          <View style={styles.cardTopo}>
            <Text style={styles.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
            <Text style={styles.cardData}>{formatarData(item.criado_em)}</Text>
          </View>
          <View style={styles.categoriaLinha}>
            <Ionicons name={cat.icone} size={13} color={cat.cor} />
            <Text style={styles.cardCategoria} numberOfLines={1}>{item.categoria_nome}</Text>
          </View>

          <View style={styles.cardRodape}>
            <View style={[styles.badge, { backgroundColor: st.fundo }]}>
              <Text style={[styles.badgeTexto, { color: st.cor }]}>{st.label}</Text>
            </View>
            {!encerrada && (
              <View style={styles.progressoTrilho}>
                <View
                  style={[
                    styles.progressoPreenchido,
                    { width: `${Math.round(progresso * 100)}%`, backgroundColor: COLORS.primaryGreen },
                  ]}
                />
              </View>
            )}
            {resolvida ? (
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryGreen} />
            ) : emValidacao ? (
              <Text style={styles.progressoTexto}>{Math.min(confirmacoes, limite)}/{limite}</Text>
            ) : null}
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

  const totalConfirmacoes = itens.reduce((soma, o) => soma + (o.confirmacoes ?? 0), 0);
  const totalResolvidas = itens.filter((o) => o.status === 'RESOLVIDA').length;
  const saudacao = primeiroNome(nome);

  const cabecalho = (
    <View style={styles.faixa}>
      <Text style={styles.saudacao}>{saudacao ? `Oi, ${saudacao}!` : 'Oi!'}</Text>
      <Text style={styles.saudacaoSub}>Veja suas ocorrências</Text>
      <View style={styles.resumo}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNumero}>{itens.length}</Text>
          <Text style={styles.resumoRotulo}>{itens.length === 1 ? 'registrada' : 'registradas'}</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNumero}>{totalConfirmacoes}</Text>
          <Text style={styles.resumoRotulo}>{totalConfirmacoes === 1 ? 'confirmação' : 'confirmações'}</Text>
        </View>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoNumero}>{totalResolvidas}</Text>
          <Text style={styles.resumoRotulo}>{totalResolvidas === 1 ? 'resolvida' : 'resolvidas'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Minhas ocorrências',
          headerBackVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <TouchableOpacity onPress={() => router.push('/mapa')} accessibilityLabel="Abrir mapa de ocorrências">
                <Ionicons name="map-outline" size={26} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/perfil')} accessibilityLabel="Abrir perfil">
                <Ionicons name="person-circle-outline" size={28} color={COLORS.white} />
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
          ListHeaderComponent={cabecalho}
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
  lista: { paddingBottom: 8, flexGrow: 1 },
  faixa: {
    backgroundColor: COLORS.primaryBlue,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  saudacao: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  saudacaoSub: { fontSize: 14, color: COLORS.onBlueMuted, marginTop: 2 },
  resumo: { flexDirection: 'row', gap: 10, marginTop: 16 },
  resumoItem: { flex: 1, backgroundColor: COLORS.onBlueTint, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  resumoNumero: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  resumoRotulo: { fontSize: 11, fontWeight: '600', color: COLORS.onBlueMuted },
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: { width: 84, height: 84, borderRadius: 14 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  categoriaLinha: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  progressoTrilho: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.border, marginHorizontal: 8, overflow: 'hidden' },
  progressoPreenchido: { height: 6, borderRadius: 3 },
  progressoTexto: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  cardInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  cardCategoria: { fontSize: 12, color: COLORS.textSecondary, flexShrink: 1 },
  cardRodape: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1 },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  cardData: { fontSize: 11, color: COLORS.textSecondary },
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
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});