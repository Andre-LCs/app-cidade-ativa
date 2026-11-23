// Serviço responsável pela comunicação do aplicativo com a API do backend.
//
// Endereço da API:
// - no navegador (npm run web), localhost funciona;
// - no celular (Expo Go), defina EXPO_PUBLIC_API_URL no frontend/.env com o IP da
//   máquina na rede local, ex.: EXPO_PUBLIC_API_URL=http://192.168.0.15:3000

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Quando o servidor está "dormindo" (plano gratuito), a primeira chamada pode levar quase 1 minuto.
// Se uma chamada passar de DEMORA_MS, quem estiver ouvindo (o AvisosProvider) mostra um aviso.
const DEMORA_MS = 6000;
let ouvinteDemora: (() => void) | null = null;

export function ouvirDemora(fn: (() => void) | null) {
  ouvinteDemora = fn;
}

// fetch com aviso de demora; use no lugar de fetch para chamadas à API
export async function fetchApi(url: string, options?: RequestInit) {
  const timer = setTimeout(() => ouvinteDemora?.(), DEMORA_MS);
  try {
    return await fetch(url, options);
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetchApi(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.erro || "Erro na requisição");
  }

  return data;
}