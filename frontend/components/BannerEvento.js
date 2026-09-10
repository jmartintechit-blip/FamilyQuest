import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { colores, tipografia, espaciado, radios } from '../theme';

// Muestra un evento especial activo (p. ej. "Hora dorada: puntos x2").
// De momento el backend no genera estos eventos todavía: `evento` llega
// como dato de prueba desde App.js hasta que exista esa lógica en el servidor.
export default function BannerEvento({ evento }) {
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
      <Animated.Text style={[estilos.icono, estiloBrillo]}>✨</Animated.Text>
      <Text style={estilos.texto}>{evento.mensaje}</Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
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
    fontSize: 20,
    marginRight: espaciado.sm,
  },
  texto: {
    ...tipografia.cuerpo,
    color: colores.doradoOscuro,
    flex: 1,
  },
});
