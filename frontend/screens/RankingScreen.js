import { useState, useCallback } from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import Tarjeta from '../components/Tarjeta';
import RankingLista from '../components/RankingLista';
import ResumenSemanal from '../components/ResumenSemanal';

export default function RankingScreen() {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado } = useTema();
  const styles = crearEstilos(colores);
  const [ranking, setRanking] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);

  async function cargarRanking() {
    try {
      const cabecera = { headers: { 'Authorization': `Bearer ${token}` } };
      const base = `${URL_BASE}/familias/${usuario.familia_id}`;
      const [respuestaRanking, respuestaResumen] = await Promise.all([
        fetch(`${base}/ranking`, cabecera),
        fetch(`${base}/resumen-semanal`, cabecera),
      ]);
      if (!respuestaRanking.ok) throw new Error();
      setRanking(await respuestaRanking.json());
      if (respuestaResumen.ok) setResumen(await respuestaResumen.json());
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarRanking();
    }, [usuario.familia_id])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text accessibilityRole="header" style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Ranking</Text>
      {errorCarga && (
        <Tarjeta>
          <Text accessibilityRole="alert" style={{ color: colores.error }}>No se pudo cargar el ranking. Comprueba la conexión.</Text>
          <TouchableOpacity onPress={cargarRanking} accessibilityRole="button" accessibilityLabel="Reintentar" style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colores.primario }}>Reintentar</Text>
          </TouchableOpacity>
        </Tarjeta>
      )}
      <Tarjeta>
        <RankingLista ranking={ranking} />
      </Tarjeta>
      <ResumenSemanal resumen={resumen} />
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
