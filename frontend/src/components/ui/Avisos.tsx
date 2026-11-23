import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type Paleta } from '../../theme';
import { ouvirDemora } from '../../services/api';

// Sistema de avisos do app, no lugar das caixas do sistema (Alert):
// - toast: mensagem curta que some sozinha (não pede toque);
// - folha: painel que sobe de baixo, no tema do app, para decisões e informações;
// - confirmar / aviso: atalhos da folha (sim/não e "entendi").

export type AcaoFolha = { id: string; rotulo: string; tipo?: 'primario' | 'secundario' | 'perigo' | 'neutro' };
type TipoToast = 'sucesso' | 'erro' | 'info';
type PedidoFolha = {
  titulo: string;
  mensagem?: string;
  conteudo?: React.ReactNode;
  acoes: AcaoFolha[];
  resolver: (id: string | null) => void;
};

type Api = {
  toast: (texto: string, tipo?: TipoToast) => void;
  folha: (p: Omit<PedidoFolha, 'resolver'>) => Promise<string | null>;
  confirmar: (o: { titulo: string; mensagem?: string; confirmar: string; cancelar?: string; perigo?: boolean }) => Promise<boolean>;
  aviso: (titulo: string, mensagem?: string) => Promise<void>;
};

const semEfeito: Api = {
  toast: () => {},
  folha: async () => null,
  confirmar: async () => false,
  aviso: async () => {},
};

const Contexto = createContext<Api>(semEfeito);

export function useAvisos() {
  return useContext(Contexto);
}

export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const { colors, escuro } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, escuro), [colors, escuro]);

  // ---- toast
  const [toastAtual, setToastAtual] = useState<{ id: number; texto: string; tipo: TipoToast } | null>(null);
  const contador = useRef(0);
  const opacidade = useRef(new Animated.Value(0)).current;

  const toast = useCallback((texto: string, tipo: TipoToast = 'info') => {
    contador.current += 1;
    setToastAtual({ id: contador.current, texto, tipo });
  }, []);

  useEffect(() => {
    if (!toastAtual) return;
    const id = toastAtual.id;
    const duracao = Math.min(6000, 2600 + toastAtual.texto.length * 40);
    opacidade.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(duracao),
      Animated.timing(opacidade, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) setToastAtual((t) => (t?.id === id ? null : t));
    });
    return () => anim.stop();
  }, [toastAtual, opacidade]);

  // servidor demorando para responder (acordando): avisa uma vez por espera
  const ultimoAvisoDemora = useRef(0);
  useEffect(() => {
    ouvirDemora(() => {
      const agora = Date.now();
      if (agora - ultimoAvisoDemora.current < 20000) return;
      ultimoAvisoDemora.current = agora;
      toast('Acordando o servidor, só um instante…', 'info');
    });
    return () => ouvirDemora(null);
  }, [toast]);

  // ---- folha
  const [pedido, setPedido] = useState<PedidoFolha | null>(null);
  const pedidoRef = useRef<PedidoFolha | null>(null);
  pedidoRef.current = pedido;

  const fechar = useCallback((id: string | null) => {
    pedidoRef.current?.resolver(id);
    setPedido(null);
  }, []);

  const folha = useCallback((p: Omit<PedidoFolha, 'resolver'>) => {
    return new Promise<string | null>((resolve) => {
      pedidoRef.current?.resolver(null); // se já havia uma aberta, ela é descartada
      setPedido({ ...p, resolver: resolve });
    });
  }, []);

  const confirmar = useCallback(
    async (o: { titulo: string; mensagem?: string; confirmar: string; cancelar?: string; perigo?: boolean }) => {
      const r = await folha({
        titulo: o.titulo,
        mensagem: o.mensagem,
        acoes: [
          { id: 'ok', rotulo: o.confirmar, tipo: o.perigo ? 'perigo' : 'primario' },
          { id: 'nao', rotulo: o.cancelar ?? 'Voltar', tipo: 'neutro' },
        ],
      });
      return r === 'ok';
    },
    [folha]
  );

  const aviso = useCallback(
    async (titulo: string, mensagem?: string) => {
      await folha({ titulo, mensagem, acoes: [{ id: 'ok', rotulo: 'Entendi', tipo: 'primario' }] });
    },
    [folha]
  );

  const api = useMemo(() => ({ toast, folha, confirmar, aviso }), [toast, folha, confirmar, aviso]);

  const iconeToast = toastAtual?.tipo === 'sucesso' ? 'checkmark-circle' : toastAtual?.tipo === 'erro' ? 'alert-circle' : 'information-circle';
  const corToast = toastAtual?.tipo === 'sucesso' ? '#4CC26A' : toastAtual?.tipo === 'erro' ? '#F87171' : '#8DB4F2';

  return (
    <Contexto.Provider value={api}>
      {children}

      {toastAtual && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + 10, opacity: opacidade, transform: [{ translateY: opacidade.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}
        >
          <Ionicons name={iconeToast} size={20} color={corToast} />
          <Text style={styles.toastTexto}>{toastAtual.texto}</Text>
        </Animated.View>
      )}

      <Modal visible={!!pedido} transparent animationType="fade" statusBarTranslucent onRequestClose={() => fechar(null)}>
        <View style={styles.fundo}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => fechar(null)} accessibilityLabel="Fechar" />
          {pedido && (
            <View style={[styles.folha, { paddingBottom: 20 + insets.bottom }]}>
              <View style={styles.alca} />
              <Text style={styles.titulo}>{pedido.titulo}</Text>
              {!!pedido.mensagem && <Text style={styles.mensagem}>{pedido.mensagem}</Text>}
              {pedido.conteudo}
              <View style={styles.acoes}>
                {pedido.acoes.map((a) => {
                  const tipo = a.tipo ?? 'secundario';
                  return (
                    <TouchableOpacity
                      key={a.id}
                      activeOpacity={0.8}
                      onPress={() => fechar(a.id)}
                      style={[styles.botao, styles[`botao_${tipo}` as const]]}
                    >
                      <Text style={[styles.botaoTexto, styles[`texto_${tipo}` as const]]}>{a.rotulo}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </Contexto.Provider>
  );
}

const makeStyles = (C: Paleta, escuro: boolean) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 9999,
      elevation: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: escuro ? '#1E2A40' : '#14305F',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    toastTexto: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    fundo: { flex: 1, backgroundColor: 'rgba(8,14,28,0.55)', justifyContent: 'flex-end' },
    folha: {
      backgroundColor: C.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderWidth: escuro ? 1 : 0,
      borderColor: C.border,
    },
    alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 14 },
    titulo: { color: C.textPrimary, fontSize: 18, fontWeight: '800' },
    mensagem: { color: C.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
    acoes: { marginTop: 18, gap: 10 },
    botao: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    botaoTexto: { fontSize: 15, fontWeight: '700' },
    botao_primario: { backgroundColor: C.primaryGreen },
    texto_primario: { color: '#FFFFFF' },
    botao_perigo: { backgroundColor: escuro ? '#B91C1C' : C.error },
    texto_perigo: { color: '#FFFFFF' },
    botao_secundario: { borderWidth: 1.5, borderColor: C.textAccent, backgroundColor: 'transparent' },
    texto_secundario: { color: C.textAccent },
    botao_neutro: { backgroundColor: 'transparent', height: 44 },
    texto_neutro: { color: C.textSecondary },
  });
