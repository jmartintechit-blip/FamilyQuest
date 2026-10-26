import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useTema } from '../context/TemaContext';

export default function TareaItem({ tarea, onMarcar, onEditar, onEliminar }) {
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
      <Ionicons
        name={esPositiva ? 'add-circle' : 'remove-circle'}
        size={22}
        color={esPositiva ? colores.primario : colores.error}
        style={estilos.icono}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[tipografia.cuerpo, estilos.nombre]}>
        {tarea.nombre} ({tarea.puntos_valor > 0 ? '+' : ''}{tarea.puntos_valor})
      </Text>
      {onEditar && (
        <TouchableOpacity
          onPress={() => onEditar(tarea)}
          style={estilos.botonIcono}
          accessibilityRole="button"
          accessibilityLabel={`Editar la tarea ${tarea.nombre}`}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={20} color={colores.textoSuave} />
        </TouchableOpacity>
      )}
      {onEliminar && (
        <TouchableOpacity
          onPress={() => onEliminar(tarea.id)}
          style={estilos.botonIcono}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar la tarea ${tarea.nombre}`}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={20} color={colores.textoSuave} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={alMarcar}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={`Marcar hecha: ${tarea.nombre}`}
      >
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
      marginRight: espaciado.sm,
    },
    nombre: {
      flex: 1,
    },
    botonIcono: {
      paddingHorizontal: espaciado.xs,
      marginRight: espaciado.xs,
    },
    boton: {
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
      paddingVertical: espaciado.sm,
      paddingHorizontal: espaciado.sm,
      minHeight: 44,
      justifyContent: 'center',
    },
    textoBoton: {
      ...tipografia.chico,
      color: colores.primarioOscuro,
    },
  });
}
