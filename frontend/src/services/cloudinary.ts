// Envia uma foto direto para o Cloudinary (upload "unsigned") e devolve o link público.
// A foto não passa pelo nosso back-end: só o link vai para a API (campo foto_url).

import { Platform } from 'react-native';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImagem(uri: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary não configurado (.env do front-end).');
  }

  const form = new FormData();
  form.append('upload_preset', UPLOAD_PRESET);

  if (Platform.OS === 'web') {
    // na web a uri é um blob/data URL: precisa virar arquivo
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'foto.jpg');
  } else {
    // no celular o React Native aceita um objeto { uri, type, name }
    form.append('file', { uri, type: 'image/jpeg', name: 'foto.jpg' } as any);
  }

  // não definir Content-Type manualmente: o fetch inclui o boundary sozinho
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Falha no upload da imagem.');
  }

  return data.secure_url; // é esse link que vai para a coluna foto_url
}