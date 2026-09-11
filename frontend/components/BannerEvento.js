import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { useTema } from '../context/TemaContext';

// Muestra un evento especial activo (p. ej. "Hora dorada: puntos x2").
// De momento el backend no genera estos eventos todavía: `evento` llega
// como dato de prueba desde App.js hasta que exista esa lógica en el servidor.
export default function BannerEvento({ evento }) {
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  const brillo = useSharedValue(0.6);

  useEffect(() => {
    brillo.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.6, { duration: 900 })),
      -1,
      false
    );
  }, []);

  const estiloBrillo = useAnimatedStyle(() => ({ opacity: brillo.value }));

  if (!evento) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      exiting={FadeOutUp.duration(300)}
      style={estilos.banner}
    >
      <Animated.View style={[estilos.icono, estiloBrillo]}>
        <Ionicons name="sparkles" size={20} color={colores.doradoOscuro} />
      </Animated.View>
      <Text style={estilos.texto}>{evento.mensaje}</Text>
    </Animated.View>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.doradoSuave,
      borderWidth: 1,
      borderColor: colores.dorado,
      borderRadius: radios.md,
      paddingVertical: espaciado.sm,
      paddingHorizontal: espaciado.md,
      marginBottom: espaciado.md,
    },
    icono: {
      marginRight: espaciado.sm,
    },
    texto: {
      ...tipografia.cuerpo,
      color: colores.doradoOscuro,
      flex: 1,
    },
  });
}
