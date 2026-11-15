// Serviço responsável pela comunicação do aplicativo com a API do backend.
//
// Endereço da API:
// - no navegador (npm run web), localhost funciona;
// - no celular (Expo Go), defina EXPO_PUBLIC_API_URL no frontend/.env com o IP da
//   máquina na rede local, ex.: EXPO_PUBLIC_API_URL=http://192.168.0.15:3000

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${API_URL}${endpoint}`, {
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