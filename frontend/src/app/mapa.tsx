import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { apiRequest } from '../services/api';
import * as tokenStorage from '../services/tokenStorage';
import { useAtualizacaoAutomatica } from '../services/atualizacaoAutomatica';
import { COLORS } from '../theme';


// Limites da validação pela comunidade. Mantenha iguais aos do back-end (routes/ocorrencias.js).
const LIMITE_VALIDACAO = 3;
const LIMITE_RESOLVIDA = 2;

type Ocorrencia = {
  id: number;
  minha: boolean;
  confirmacoes: number;
  votos_resolvida: number;
  meu_voto: string | null;
  categoria_nome: string;
  titulo: string;
  descricao: string | null;
  foto_url: string | null;
  status: string;
  criado_em: string;
  latitude: number | string;
  longitude: number | string;
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

// Página do mapa: Leaflet + OpenStreetMap suavizado por filtro CSS, sem chave de API.
// Pinos por categoria (cor + ícone), agrupamento de pontos próximos, filtros por categoria
// e cartão de detalhes na parte de baixo. Os textos entram via textContent (sem HTML injetado).
// Observação: não usar crases nem ${} dentro desta string.
const PAGINA = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
<style>
  html,body,#mapa{height:100%;margin:0;font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif}
  .leaflet-control-attribution{font-size:9px}
  .leaflet-tile-pane{filter:saturate(.55) contrast(.95) brightness(1.05)}
  .leaflet-top.leaflet-left{top:52px}
  .pin-wrap{background:none;border:0}
  .pin{width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid #fff;
       box-shadow:0 2px 6px rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;box-sizing:border-box}
  .pin svg{transform:rotate(45deg);width:17px;height:17px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .cl-wrap{background:none;border:0}
  .cl{width:40px;height:40px;border-radius:50%;background:#1F3F77;color:#fff;border:3px solid #fff;
      box-shadow:0 2px 8px rgba(15,23,42,.4);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-sizing:border-box}
  #barra{position:absolute;top:8px;left:8px;right:8px;z-index:1000;display:flex;gap:6px;overflow-x:auto;white-space:nowrap;padding-bottom:4px}
  #barra::-webkit-scrollbar{display:none}
  .chip{flex:0 0 auto;display:flex;align-items:center;gap:6px;background:#fff;color:#0F172A;border:0;border-radius:18px;
        padding:7px 12px;font-size:12px;font-weight:600;box-shadow:0 1px 4px rgba(15,23,42,.25)}
  .chip i{width:10px;height:10px;border-radius:50%;display:inline-block}
  .chip.off{opacity:.45}
  #total{background:#1F3F77;color:#fff;box-shadow:0 1px 4px rgba(15,23,42,.35)}
  #card{position:absolute;left:0;right:0;bottom:0;z-index:1100;background:#1F3F77;color:#fff;border-radius:18px 18px 0 0;
        padding:16px 16px calc(16px + var(--safe,0px));transform:translateY(105%);transition:transform .2s ease;box-shadow:0 -4px 16px rgba(15,23,42,.3)}
  #card.on{transform:translateY(0)}
  #corpo{display:flex;flex-direction:column;gap:10px}
  #fotoBox{position:relative;display:none}
  #foto{width:100%;height:170px;border-radius:12px;object-fit:cover;background:#14284F;display:block}
  #ampliar{position:absolute;right:8px;bottom:8px;background:rgba(15,23,42,.7);color:#fff;font-size:11px;font-weight:600;border-radius:12px;padding:4px 9px}
  #lb{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.94);display:none;align-items:center;justify-content:center}
  #lb.on{display:flex}
  #lb img{max-width:100%;max-height:100%;object-fit:contain}
  #lbx{position:absolute;top:14px;right:16px;color:#fff;font-size:30px;line-height:1;background:none;border:0}
  #info{flex:1;min-width:0}
  #cat{font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;opacity:.95}
  #cat i{width:10px;height:10px;border-radius:50%;display:inline-block;border:1.5px solid #fff}
  #tit{font-size:17px;font-weight:700;margin:4px 0 2px;overflow-wrap:anywhere}
  #desc{font-size:13px;opacity:.85;margin:0 0 8px;overflow-wrap:anywhere;display:none}
  #meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px}
  #votos{margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.2)}
  #prog{font-size:12px;opacity:.9;margin-bottom:8px}
  #botoes{display:flex;gap:8px}
  #botoes.ocupado{opacity:.55;pointer-events:none}
  #botoes button{flex:1;border:1.5px solid #fff;background:transparent;color:#fff;border-radius:10px;padding:10px 6px;font-size:13px;font-weight:700}
  #botoes button.sel{background:#fff;color:#1F3F77}
  #msg{font-size:12px;color:#FECACA;margin-top:6px}
  #st{border-radius:10px;padding:3px 9px;font-weight:700;color:#fff}
  #x{position:absolute;top:8px;right:12px;background:none;border:0;color:#fff;font-size:22px;line-height:1;padding:4px 8px}
</style>
</head><body>
<div id="mapa"></div>
<div id="barra"></div>
<div id="card">
  <button id="x" aria-label="Fechar">&times;</button>
  <div id="corpo">
    <div id="fotoBox"><img id="foto" alt=""/><span id="ampliar">Toque para ampliar</span></div>
    <div id="info">
      <div id="cat"><i></i><span></span></div>
      <div id="tit"></div>
      <p id="desc"></p>
      <div id="meta"><span id="st"></span><span id="dias"></span></div>
    </div>
    <div id="votos">
      <div id="prog"></div>
      <div id="botoes">
        <button id="bAinda" type="button"></button>
        <button id="bRes" type="button"></button>
      </div>
      <div id="msg"></div>
    </div>
  </div>
</div>
<div id="lb"><button id="lbx" aria-label="Fechar">&times;</button><img id="lbimg" alt=""/></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script>
var DADOS = __DADOS__;
document.documentElement.style.setProperty('--safe', '__SAFE__px');

var CATS = [
  { k: 'buraco',   nome: 'Buraco',      cor: '#D9480F', svg: '<ellipse cx="12" cy="13" rx="8" ry="5"/><ellipse cx="12" cy="13" rx="3.5" ry="2"/>' },
  { k: 'ilumin',   nome: 'Iluminação',  cor: '#E8A100', svg: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>' },
  { k: 'lixo',     nome: 'Lixo',        cor: '#17A398', svg: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/>' },
  { k: 'cal',      nome: 'Calçada',     cor: '#0B74C4', svg: '<path d="M4 6h16v12H4zM12 6l-2 4 3 2-2 6"/>' },
  { k: 'veic',     nome: 'Veículo',     cor: '#7B61C9', svg: '<path d="M4 16v-4l2-5h12l2 5v4zM4 16v2M20 16v2"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>' }
];
var PADRAO = { k: 'outro', nome: 'Outros', cor: '#1F3F77', svg: '<circle cx="12" cy="12" r="4"/>' };

function norm(t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function categoriaDe(nome) {
  var n = norm(nome);
  if (n.indexOf('buraco') >= 0) return CATS[0];
  if (n.indexOf('ilumin') >= 0) return CATS[1];
  if (n.indexOf('lixo') >= 0 || n.indexOf('entulho') >= 0) return CATS[2];
  if (n.indexOf('calcada') >= 0) return CATS[3];
  if (n.indexOf('veiculo') >= 0) return CATS[4];
  return PADRAO;
}
function corDoStatus(o, cat) {
  if (o.status === 'RESOLVIDA') return '#32A041';
  if (o.status === 'EXPIRADA' || o.status === 'DUPLICADA') return '#94A3B8';
  return cat.cor;
}
var COR_STATUS = { RESOLVIDA: '#32A041', EXPIRADA: '#64748B', DUPLICADA: '#64748B', EM_ATENDIMENTO: '#E8A100', EM_VALIDACAO: '#E8A100' };

var mapa = L.map('mapa', { zoomControl: true }).setView([-15.7801, -47.9292], 12);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, keepBuffer: 4,
  attribution: '&copy; OpenStreetMap'
}).addTo(mapa);

var grupo = L.markerClusterGroup({
  showCoverageOnHover: false, maxClusterRadius: 50,
  iconCreateFunction: function (c) {
    return L.divIcon({ html: '<div class="cl">' + c.getChildCount() + '</div>', className: 'cl-wrap', iconSize: [40, 40] });
  }
});
mapa.addLayer(grupo);

var card = document.getElementById('card');
var fotoAtual = null;
var lb = document.getElementById('lb');
document.getElementById('fotoBox').onclick = function () {
  if (!fotoAtual) return;
  document.getElementById('lbimg').src = fotoAtual;
  lb.classList.add('on');
};
lb.onclick = function () { lb.classList.remove('on'); };
function fecharCard() { card.classList.remove('on'); }
document.getElementById('x').onclick = fecharCard;
mapa.on('click', fecharCard);

var LIM_VAL = __LIM_VAL__, LIM_RES = __LIM_RES__;
var atual = null, enviando = false, porId = {};

function enviar(obj) {
  var t = JSON.stringify(obj);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(t);
  else window.parent.postMessage(t, '*');
}
function ocupado(sim) {
  enviando = sim;
  document.getElementById('botoes').classList.toggle('ocupado', sim);
}
function desenharVotos() {
  if (!atual) return;
  var o = atual.o;
  var encerrada = o.status === 'RESOLVIDA';
  var bA = document.getElementById('bAinda'), bR = document.getElementById('bRes');
  document.getElementById('botoes').style.display = encerrada ? 'none' : 'flex';
  bA.style.display = o.minha ? 'none' : 'block';
  bA.textContent = 'Ainda está lá (' + o.confirmacoes + ')';
  bR.textContent = o.minha ? 'Marcar como resolvida' : 'Já foi resolvido (' + o.votosRes + ')';
  bA.classList.toggle('sel', o.meuVoto === 'AINDA_EXISTE');
  bR.classList.toggle('sel', o.meuVoto === 'RESOLVIDA');
  var t;
  if (encerrada) t = 'Resolvida';
  else if (o.status === 'VALIDADA') t = 'Validada pela comunidade (' + o.confirmacoes + ' confirmações)';
  else t = o.confirmacoes + ' de ' + LIM_VAL + ' confirmações para validar';
  if (!encerrada && o.votosRes > 0) t += ' • ' + o.votosRes + ' de ' + LIM_RES + ' votos de resolvido';
  document.getElementById('prog').textContent = t;
  document.getElementById('msg').textContent = '';
}
function votar(tipo) {
  if (!atual || enviando) return;
  ocupado(true);
  document.getElementById('msg').textContent = '';
  enviar({ tipo: 'votar', id: atual.o.id, voto: tipo });
}
document.getElementById('bAinda').onclick = function () { votar('AINDA_EXISTE'); };
document.getElementById('bRes').onclick = function () { votar('RESOLVIDA'); };

window.atualizarOcorrencia = function (r) {
  ocupado(false);
  var it = porId[r.id];
  if (!it) return;
  var o = it.o;
  o.status = r.status; o.statusRotulo = r.statusRotulo;
  o.confirmacoes = r.confirmacoes; o.votosRes = r.votos_resolvida; o.meuVoto = r.meu_voto;
  it.m.setIcon(iconePara(o, it.cat));
  if (atual && atual.o.id === o.id) abrirCard(o, it.cat);
};
window.mostrarErro = function (m) {
  ocupado(false);
  document.getElementById('msg').textContent = m;
};
window.addEventListener('message', function (e) {
  try {
    var m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (m && m.tipo === 'atualizar') window.atualizarOcorrencia(m.dados);
    else if (m && m.tipo === 'erro') window.mostrarErro(m.msg);
    else if (m && m.tipo === 'tudo') window.atualizarTudo(m.dados);
  } catch (_) {}
});

function iconePara(o, cat) {
  return L.divIcon({
    html: '<div class="pin" style="background:' + corDoStatus(o, cat) + '"><svg viewBox="0 0 24 24">' + cat.svg + '</svg></div>',
    className: 'pin-wrap', iconSize: [34, 34], iconAnchor: [17, 42]
  });
}

function abrirCard(o, cat) {
  atual = { o: o, cat: cat };
  document.querySelector('#cat span').textContent = cat.nome === 'Outros' ? o.categoria : o.categoria;
  document.querySelector('#cat i').style.background = cat.cor;
  document.getElementById('tit').textContent = o.titulo;
  var d = document.getElementById('desc');
  if (o.descricao) { d.textContent = o.descricao; d.style.display = 'block'; } else { d.style.display = 'none'; }
  var f = document.getElementById('foto');
  var box = document.getElementById('fotoBox');
  if (o.foto && o.foto.indexOf('https://res.cloudinary.com/') === 0) {
    f.src = o.foto.replace('/upload/', '/upload/w_800,h_400,c_fill,q_auto,f_auto/');
    box.style.display = 'block';
    fotoAtual = o.foto.replace('/upload/', '/upload/w_1600,c_limit,q_auto,f_auto/');
  } else { f.removeAttribute('src'); box.style.display = 'none'; fotoAtual = null; }
  var st = document.getElementById('st');
  st.textContent = o.statusRotulo;
  st.style.background = COR_STATUS[o.status] || '#0B74C4';
  var dias = Math.max(0, Math.floor((Date.now() - new Date(o.criado).getTime()) / 86400000));
  var aberta = o.status !== 'RESOLVIDA' && o.status !== 'EXPIRADA' && o.status !== 'DUPLICADA';
  document.getElementById('dias').textContent = aberta
    ? (dias === 0 ? 'Registrada hoje' : 'Aberta há ' + dias + (dias === 1 ? ' dia' : ' dias'))
    : 'Registrada em ' + new Date(o.criado).toLocaleDateString('pt-BR');
  desenharVotos();
  card.classList.add('on');
}

var itens = [];
function adicionar(o) {
  if (isNaN(o.lat) || isNaN(o.lon)) return;
  var cat = categoriaDe(o.categoria);
  var m = L.marker([o.lat, o.lon], { icon: iconePara(o, cat) });
  m.on('click', function (e) { L.DomEvent.stopPropagation(e); abrirCard(o, cat); });
  porId[o.id] = { o: o, m: m, cat: cat };
  itens.push({ m: m, k: cat.k });
}
DADOS.forEach(adicionar);

// Atualização automática: troca só o que mudou, sem mexer no zoom nem no cartão aberto.
window.atualizarTudo = function (lista) {
  var presentes = {};
  lista.forEach(function (n) {
    presentes[n.id] = true;
    var it = porId[n.id];
    if (!it) { adicionar(n); return; }
    var o = it.o;
    o.status = n.status; o.statusRotulo = n.statusRotulo;
    o.confirmacoes = n.confirmacoes; o.votosRes = n.votosRes; o.meuVoto = n.meuVoto;
    o.titulo = n.titulo; o.descricao = n.descricao; o.foto = n.foto;
    it.m.setIcon(iconePara(o, it.cat));
  });
  Object.keys(porId).forEach(function (id) {
    if (presentes[id]) return;
    var it = porId[id];
    delete porId[id];
    itens = itens.filter(function (i) { return i.m !== it.m; });
    grupo.removeLayer(it.m);
    if (atual && String(atual.o.id) === id) { atual = null; fecharCard(); }
  });
  desenhar(false);
  if (atual && card.classList.contains('on')) abrirCard(atual.o, atual.cat);
};

var ativos = {};
CATS.concat([PADRAO]).forEach(function (c) { ativos[c.k] = true; });
var total = document.createElement('div');
total.id = 'total'; total.className = 'chip';
var barra = document.getElementById('barra');
barra.appendChild(total);

function desenhar(ajustar) {
  grupo.clearLayers();
  var vis = itens.filter(function (i) { return ativos[i.k]; });
  grupo.addLayers(vis.map(function (i) { return i.m; }));
  total.textContent = vis.length === 1 ? '1 ocorrência' : vis.length + ' ocorrências';
  if (ajustar && vis.length) {
    var pts = vis.map(function (i) { return i.m.getLatLng(); });
    if (pts.length === 1) mapa.setView(pts[0], 16);
    else mapa.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 16 });
  }
}

CATS.forEach(function (c) {
  var b = document.createElement('button');
  b.className = 'chip';
  var dot = document.createElement('i'); dot.style.background = c.cor;
  b.appendChild(dot); b.appendChild(document.createTextNode(c.nome));
  b.onclick = function () {
    ativos[c.k] = !ativos[c.k];
    b.classList.toggle('off', !ativos[c.k]);
    fecharCard(); desenhar(false);
  };
  barra.appendChild(b);
});

desenhar(true);
</script></body></html>`;

// Dados no formato que a página do mapa espera (expiradas e duplicadas não aparecem no mapa).
function prepararDados(pontos: Ocorrencia[]) {
  return pontos
    .filter((o) => o.status !== 'EXPIRADA' && o.status !== 'DUPLICADA')
    .map((o) => ({
    id: o.id,
    minha: o.minha,
    confirmacoes: o.confirmacoes ?? 0,
    votosRes: o.votos_resolvida ?? 0,
    meuVoto: o.meu_voto,
    lat: Number(o.latitude),
    lon: Number(o.longitude),
    titulo: o.titulo,
    descricao: o.descricao,
    foto: o.foto_url,
    categoria: o.categoria_nome,
    status: o.status,
    statusRotulo: ROTULO_STATUS[o.status] ?? o.status,
    criado: o.criado_em,
  }));
}

function montarHtml(pontos: Ocorrencia[], margemInferior: number) {
  const json = JSON.stringify(prepararDados(pontos)).replace(/</g, '\\u003c');

  return PAGINA.replace('__DADOS__', () => json)
    .replace('__SAFE__', () => String(Math.round(margemInferior)))
    .replace('__LIM_VAL__', () => String(LIMITE_VALIDACAO))
    .replace('__LIM_RES__', () => String(LIMITE_RESOLVIDA));
}

export default function Mapa() {
  const insets = useSafeAreaInsets();
  const [html, setHtml] = useState('');
  const insetRef = useRef(0);
  insetRef.current = insets.bottom;
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const paginaProntaRef = useRef(false);
  const responderRef = useRef<(msg: any) => void>(() => {});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // silencioso = atualização automática: com a página pronta, troca só os pinos que mudaram
  const carregar = useCallback(async (silencioso = false) => {
    setErro(null);
    const token = await tokenStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const dados = await apiRequest('/ocorrencias', { headers: { Authorization: `Bearer ${token}` } });
      if (silencioso && paginaProntaRef.current) {
        responderRef.current({ tipo: 'tudo', dados: prepararDados(dados) });
      } else {
        paginaProntaRef.current = false;
        setHtml(montarHtml(dados, insetRef.current));
      }
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

  useAtualizacaoAutomatica(() => carregar(true));

  const responder = useCallback((msg: { tipo: 'atualizar' | 'tudo'; dados: any } | { tipo: 'erro'; msg: string }) => {
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*');
      return;
    }
    let chamada: string;
    if (msg.tipo === 'erro') chamada = `window.mostrarErro(${JSON.stringify(msg.msg)});`;
    else if (msg.tipo === 'tudo') chamada = `window.atualizarTudo(${JSON.stringify(msg.dados)});`;
    else chamada = `window.atualizarOcorrencia(${JSON.stringify(msg.dados)});`;
    webViewRef.current?.injectJavaScript(`${chamada} true;`);
  }, []);
  responderRef.current = responder;

  // A página do mapa pede o voto; o token fica aqui no app, nunca dentro da página.
  const processarMensagem = useCallback(
    async (texto: string) => {
      let m: any;
      try {
        m = JSON.parse(texto);
      } catch {
        return;
      }
      if (m?.tipo !== 'votar') return;

      const token = await tokenStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const r = await apiRequest(`/ocorrencias/${Number(m.id)}/confirmacoes`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tipo: m.voto }),
        });
        responder({ tipo: 'atualizar', dados: { ...r, statusRotulo: ROTULO_STATUS[r.status] ?? r.status } });
      } catch (e) {
        responder({ tipo: 'erro', msg: e instanceof Error ? e.message : 'Não foi possível registrar o voto.' });
      }
    },
    [responder]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const aoReceber = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      if (typeof e.data === 'string') processarMensagem(e.data);
    };
    window.addEventListener('message', aoReceber);
    return () => window.removeEventListener('message', aoReceber);
  }, [processarMensagem]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mapa de ocorrências',
          headerStyle: { backgroundColor: COLORS.primaryBlue },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      {erro && (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.error} />
          <Text style={styles.bannerTexto}>{erro}</Text>
          <TouchableOpacity onPress={() => carregar()}>
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
          ref: iframeRef,
          srcDoc: html,
          onLoad: () => { paginaProntaRef.current = true; },
          style: { flex: 1, width: '100%', height: '100%', border: 0 },
          title: 'Mapa de ocorrências',
        })
      ) : (
        <WebView
          originWhitelist={['*']}
          ref={webViewRef}
          source={{ html }}
          onMessage={(e) => processarMensagem(e.nativeEvent.data)}
          onLoadEnd={() => { paginaProntaRef.current = true; }}
          style={styles.mapa}
          javaScriptEnabled
          startInLoadingState
        />
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
});
