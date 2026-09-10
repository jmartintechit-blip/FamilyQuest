import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  Extrapolation,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import { colores, tipografia, espaciado, radios } from '../../theme';

// react-native-svg no anima sus props por sí solo: envolvemos <Path> con
// Reanimated para poder cambiar su "fill" o su "d" cuadro a cuadro.
const AnimatedPath = Animated.createAnimatedComponent(Path);

function mensajePorSalud(salud) {
  if (salud >= 80) return '¡Estoy genial, gracias por cuidarme!';
  if (salud >= 50) return 'Voy tirando, ¿me ayudas un poco?';
  if (salud >= 20) return 'Me vendría bien una ayudita...';
  return 'Necesito mucho cariño ahora mismo';
}

// puntosFlotantes: [{ id, texto, color }] — mensajes tipo "+5" que aparecen
// un instante sobre la mascota cuando se marca una tarea, y luego desaparecen.
export default function MascotaHero({ salud, puntosFlotantes = [] }) {
  const saludAnimada = useSharedValue(salud);
  const respiracion = useSharedValue(0);

  // Cuando cambia la salud real (viene del backend), la animamos hacia el
  // nuevo valor en vez de saltar de golpe.
  useEffect(() => {
    saludAnimada.value = withTiming(salud, { duration: 700 });
  }, [salud]);

  // Loop infinito de "respiración", independiente de la salud.
  useEffect(() => {
    respiracion.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0, { duration: 1800 })),
      -1,
      false
    );
  }, []);

  const estiloCuerpo = useAnimatedStyle(() => {
    const amplitudRebote = interpolate(saludAnimada.value, [0, 100], [0.006, 0.035], Extrapolation.CLAMP);
    const escala = 1 + respiracion.value * amplitudRebote;
    const inclinacion = interpolate(saludAnimada.value, [0, 100], [-6, 0], Extrapolation.CLAMP);
    return { transform: [{ scale: escala }, { rotate: `${inclinacion}deg` }] };
  });

  const estiloGlow = useAnimatedStyle(() => {
    const opacidad = interpolate(saludAnimada.value, [0, 50, 100], [0, 0.12, 0.55], Extrapolation.CLAMP);
    const escalaGlow = 1 + respiracion.value * 0.06;
    return { opacity: opacidad, transform: [{ scale: escalaGlow }] };
  });

  const propsCuerpo = useAnimatedProps(() => ({
    fill: interpolateColor(saludAnimada.value, [0, 50, 100], colores.mascotaGradiente),
  }));

  // La boca pasa de una curva triste a una sonrisa moviendo su punto de control.
  const propsBoca = useAnimatedProps(() => {
    const curvatura = interpolate(saludAnimada.value, [0, 100], [122, 152], Extrapolation.CLAMP);
    return { d: `M75,133 Q100,${curvatura} 125,133` };
  });

  const estiloBarra = useAnimatedStyle(() => ({
    width: `${saludAnimada.value}%`,
    backgroundColor: interpolateColor(saludAnimada.value, [0, 50, 100], colores.mascotaGradiente),
  }));

  return (
    <View style={estilos.contenedor}>
      <Animated.View style={[estilos.glow, estiloGlow]} />

      {puntosFlotantes.map((p) => (
        <Animated.View
          key={p.id}
          entering={FadeInUp.duration(350)}
          exiting={FadeOutUp.duration(500)}
          style={estilos.puntoFlotante}
        >
          <Text style={[estilos.textoPuntoFlotante, { color: p.color }]}>{p.texto}</Text>
        </Animated.View>
      ))}

      <Animated.View style={estiloCuerpo}>
        <Svg width={160} height={160} viewBox="0 0 200 200">
          <Path d="M100,35 C90,10 60,5 50,20 C65,35 85,38 100,35 Z" fill={colores.primario} />
          <Path d="M100,35 C110,10 140,5 150,20 C135,35 115,38 100,35 Z" fill={colores.primarioOscuro} />

          <AnimatedPath
            animatedProps={propsCuerpo}
            d="M100,40 C145,40 175,75 175,115 C175,155 142,180 100,180 C58,180 25,155 25,115 C25,75 55,40 100,40 Z"
          />

          <Circle cx="78" cy="105" r="7" fill={colores.texto} />
          <Circle cx="122" cy="105" r="7" fill={colores.texto} />

          <AnimatedPath
            animatedProps={propsBoca}
            stroke={colores.texto}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <Text style={estilos.mensaje}>{mensajePorSalud(salud)}</Text>

      <View style={estilos.barraFondo}>
        <Animated.View style={[estilos.barraRelleno, estiloBarra]} />
      </View>
      <Text style={estilos.textoSalud}>Salud: {salud}/100</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: espaciado.lg,
  },
  glow: {
    position: 'absolute',
    top: espaciado.lg - 10,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colores.mascotaGlow,
  },
  puntoFlotante: {
    position: 'absolute',
    top: espaciado.md,
    alignSelf: 'center',
    zIndex: 10,
  },
  textoPuntoFlotante: {
    ...tipografia.titulo,
  },
  mensaje: {
    ...tipografia.subtitulo,
    textAlign: 'center',
    marginTop: espaciado.sm,
    marginBottom: espaciado.md,
    paddingHorizontal: espaciado.lg,
  },
  barraFondo: {
    width: '80%',
    height: 12,
    borderRadius: radios.completo,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    borderRadius: radios.completo,
  },
  textoSalud: {
    ...tipografia.chico,
    marginTop: espaciado.xs,
  },
});
