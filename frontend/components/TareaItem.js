import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useTema } from '../context/TemaContext';

export default function TareaItem({ tarea, onMarcar }) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  const escala = useSharedValue(1);
  const esPositiva = tarea.tipo === 'positiva';

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  function alMarcar() {
    escala.value = withSequence(withTiming(0.95, { duration: 90 }), withTiming(1, { duration: 150 }));
    onMarcar(tarea.id);
  }

  return (
    <Animated.View style={[estilos.fila, estiloAnimado]}>
      <Text style={estilos.icono}>{esPositiva ? '🌱' : '🥀'}</Text>
      <Text style={[tipografia.cuerpo, estilos.nombre]}>
        {tarea.nombre} ({tarea.puntos_valor > 0 ? '+' : ''}{tarea.puntos_valor})
      </Text>
      <TouchableOpacity onPress={alMarcar} style={estilos.boton}>
        <Text style={estilos.textoBoton}>Marcar hecha</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    icono: {
      fontSize: 20,
      marginRight: espaciado.sm,
    },
    nombre: {
      flex: 1,
    },
    boton: {
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
      paddingVertical: espaciado.xs,
      paddingHorizontal: espaciado.sm,
    },
    textoBoton: {
      ...tipografia.chico,
      color: colores.primarioOscuro,
    },
  });
}
