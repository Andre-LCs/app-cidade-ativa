import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import * as tokenStorage from '../services/tokenStorage';

// Tela inicial: decide para onde ir conforme exista (ou não) uma sessão salva.
export default function Index() {
  useEffect(() => {
    const decidir = async () => {
      const token = await tokenStorage.getItem('token');
      router.replace(token ? '/minhas-ocorrencias' : '/login');
    };
    decidir();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#1F3F77" />
    </View>
  );
}