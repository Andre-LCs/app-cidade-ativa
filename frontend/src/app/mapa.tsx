import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { apiRequest } from '../services/api';
import * as tokenStorage from '../services/tokenStorage';

const COLORS = {
  primaryBlue: '#1F3F77',
  background: '#F8FAFC',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  white: '#FFFFFF',
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  errorBorder: '#FECACA',
};

type Ocorrencia = {
  id: number;
  categoria_nome: string;
  titulo: string;
  status: string;
  latitude: number | string;
  longitude: number | string;
};

// Cor do marcador por status (mesma lógica de cores da lista)
const COR_STATUS: Record<string, string> = {
  ABERTA: '#1F3F77',
  EM_VALIDACAO: '#B45309',
  VALIDADA: '#15803D',
  ENVIADA_PREFEITURA: '#1F3F77',
  EM_ATENDIMENTO: '#B45309',
  RESOLVIDA: '#15803D',
  EXPIRADA: '#64748B',
  DUPLICADA: '#64748B',
};

const ROTULO_STATUS: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_VALIDACAO: 'Em validação',
  VALIDADA: 'Validada',
  ENVIADA_PREFEITURA: 'Enviada ao órgão responsável',
  EM_ATENDIMENTO: 'Em atendimento',
  RESOLVIDA: 'Resolvida',
  EXPIRADA: 'Expirada',
  DUPLICADA: 'Duplicada',
};

// Monta a página do mapa (Leaflet + OpenStreetMap, sem chave de API).
// Os dados vão como JSON e os textos entram no popup via textContent (sem HTML injetado).
function montarHtml(pontos: Ocorrencia[]) {
  const dados = pontos.map((o) => ({
    lat: Number(o.latitude),
    lon: Number(o.longitude),
    titulo: o.titulo,
    categoria: o.categoria_nome,
    status: ROTULO_STATUS[o.status] ?? o.status,
    cor: COR_STATUS[o.status] ?? '#1F3F77',
  }));
  const json = JSON.stringify(dados).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#mapa{height:100%;margin:0}body{font-family:sans-serif}.p b{display:block;margin-bottom:2px}.p span{color:#64748B;font-size:12px}</style>
</head><body><div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var dados = ${json};
var mapa = L.map('mapa').setView([-15.7801, -47.9292], 12);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(mapa);
var limites = [];
dados.forEach(function (o) {
  if (isNaN(o.lat) || isNaN(o.lon)) return;
  var m = L.circleMarker([o.lat, o.lon], {
    radius: 10, color: '#FFFFFF', weight: 2, fillColor: o.cor, fillOpacity: 0.95
  }).addTo(mapa);
  var div = document.createElement('div');
  div.className = 'p';
  var t = document.createElement('b'); t.textContent = o.titulo;
  var c = document.createElement('span'); c.textContent = o.categoria + ' • ' + o.status;
  div.appendChild(t); div.appendChild(c);
  m.bindPopup(div);
  limites.push([o.lat, o.lon]);
});
if (limites.length === 1) mapa.setView(limites[0], 16);
else if (limites.length > 1) mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 });
</script></body></html>`;
}

export default function Mapa() {
  const insets = useSafeAreaInsets();
  const [itens, setItens] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const dados = await apiRequest('/ocorrencias', { headers: { Authorization: `Bearer ${token}` } });
      setItens(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar as ocorrências.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const html = useMemo(() => montarHtml(itens), [itens]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mapa de ocorrências' }} />

      {erro && (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
          <Text style={styles.bannerTexto}>{erro}</Text>
          <TouchableOpacity onPress={carregar}>
            <Text style={styles.link}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      )}

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        </View>
      ) : Platform.OS === 'web' ? (
        React.createElement('iframe', {
          srcDoc: html,
          style: { flex: 1, width: '100%', height: '100%', border: 0 },
          title: 'Mapa de ocorrências',
        })
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.mapa}
          javaScriptEnabled
          startInLoadingState
        />
      )}

      {!carregando && !erro && (
        <View style={[styles.contador, { bottom: 16 + insets.bottom }]}>
          <Text style={styles.contadorTexto}>
            {itens.length === 1 ? '1 ocorrência no mapa' : `${itens.length} ocorrências no mapa`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapa: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.errorBackground,
    borderColor: COLORS.errorBorder,
    borderWidth: 1,
    padding: 12,
  },
  bannerTexto: { flex: 1, color: COLORS.error, fontSize: 13 },
  link: { color: COLORS.primaryBlue, fontWeight: '700', fontSize: 13 },
  contador: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  contadorTexto: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '600' },
});
