import { useState, useCallback } from 'react';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import Tarjeta from '../components/Tarjeta';
import RankingLista from '../components/RankingLista';

export default function RankingScreen() {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado } = useTema();
  const styles = crearEstilos(colores);
  const [ranking, setRanking] = useState([]);

  async function cargarRanking() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/ranking`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      setRanking(datos);
    } catch (error) {
      console.log('Error cargando ranking', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarRanking();
    }, [usuario.familia_id])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Ranking</Text>
      <Tarjeta>
        <RankingLista ranking={ranking} />
      </Tarjeta>
    </ScrollView>
  );
}

function crearEstilos(colores) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
  });
}
