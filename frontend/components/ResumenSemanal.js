import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import Tarjeta from './Tarjeta';

// Resumen de la semana anterior, que el servidor guarda justo antes de reiniciar el ranking.
export default function ResumenSemanal({ resumen }) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  if (!resumen) return null;

  return (
    <Tarjeta>
      <Text accessibilityRole="header" style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>
        Resumen de la semana pasada
      </Text>

      <View style={estilos.ganador}>
        <Ionicons name="trophy" size={26} color={colores.doradoOscuro} accessibilityElementsHidden importantForAccessibility="no" />
        <Text style={estilos.textoGanador}>
          {resumen.ganador
            ? `${resumen.ganador.nombre} ganó con ${resumen.ganador.puntos} puntos`
            : 'Esta semana nadie sumó puntos. ¡A por la siguiente!'}
        </Text>
      </View>

      <Text style={[tipografia.chico, { marginBottom: espaciado.xs }]}>
        {resumen.total_tareas} registros en total
        {resumen.tarea_top ? ` · la más repetida: ${resumen.tarea_top.nombre} (${resumen.tarea_top.veces} veces)` : ''}
      </Text>

      {resumen.ranking.map((miembro, indice) => (
        <View key={miembro.usuario_id} style={estilos.fila}>
          <Text style={tipografia.cuerpo}>{indice + 1}. {miembro.nombre}</Text>
          <Text style={estilos.puntos}>{miembro.puntos} pts · {miembro.tareas} reg.</Text>
        </View>
      ))}
    </Tarjeta>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    ganador: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaciado.sm,
      backgroundColor: colores.doradoSuave,
      borderRadius: radios.md,
      padding: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    textoGanador: {
      ...tipografia.cuerpo,
      color: colores.doradoOscuro,
      flex: 1,
    },
    fila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: espaciado.xs,
    },
    puntos: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
  });
}
