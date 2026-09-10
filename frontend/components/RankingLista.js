import { View, Text, StyleSheet } from 'react-native';
import { colores, tipografia, espaciado, radios } from '../theme';

const MEDALLAS = ['🥇', '🥈', '🥉'];

export default function RankingLista({ ranking }) {
  const maximo = Math.max(1, ...ranking.map((p) => p.puntos_totales));

  return (
    <View>
      {ranking.map((persona, indice) => (
        <View key={indice} style={estilos.fila}>
          <Text style={estilos.posicion}>{MEDALLAS[indice] ?? `${indice + 1}º`}</Text>

          <View style={estilos.info}>
            <Text style={tipografia.cuerpo}>{persona.nombre}</Text>
            <View style={estilos.barraFondo}>
              <View
                style={[
                  estilos.barraRelleno,
                  { width: `${Math.max(4, (persona.puntos_totales / maximo) * 100)}%` },
                ]}
              />
            </View>
          </View>

          <Text style={estilos.puntos}>{persona.puntos_totales}</Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
  },
  posicion: {
    fontSize: 20,
    width: 36,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    marginHorizontal: espaciado.sm,
  },
  barraFondo: {
    height: 6,
    borderRadius: radios.completo,
    backgroundColor: colores.superficieSuave,
    marginTop: espaciado.xs,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: radios.completo,
    backgroundColor: colores.primario,
  },
  puntos: {
    ...tipografia.subtitulo,
    color: colores.primarioOscuro,
    minWidth: 40,
    textAlign: 'right',
  },
});
