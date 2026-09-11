import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
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
import { colores, tipografia, fuentes, espaciado, radios } from '../../theme';

// react-native-svg no anima sus props por sí solo: envolvemos las formas con
// Reanimated para poder cambiar su "fill" o su "d" cuadro a cuadro.
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

function mensajePorSalud(salud) {
  if (salud >= 80) return '¡Estoy genial, gracias por cuidarme!';
  if (salud >= 50) return 'Voy tirando, ¿me ayudas un poco?';
  if (salud >= 20) return 'Me vendría bien una ayudita...';
  return 'Necesito mucho cariño ahora mismo';
}

// puntosFlotantes: [{ id, texto, color }] — mensajes tipo "+5" que aparecen
// un instante sobre la mascota cuando se marca una tarea, y luego desaparecen.
// nombre / onPresionarNombre: el nombre que le puso la familia a la mascota,
// tocable para poder cambiarlo.
export default function MascotaHero({ salud, puntosFlotantes = [], nombre, onPresionarNombre }) {
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
    const opacidad = interpolate(saludAnimada.value, [0, 50, 100], [0, 0.15, 0.6], Extrapolation.CLAMP);
    const escalaGlow = 1 + respiracion.value * 0.06;
    return { opacity: opacidad, transform: [{ scale: escalaGlow }] };
  });

  const propsCuerpo = useAnimatedProps(() => ({
    fill: interpolateColor(saludAnimada.value, [0, 50, 100], colores.mascotaGradiente),
  }));

  // Los mofletes solo se notan bien cuando está sano y contento.
  const propsMofletes = useAnimatedProps(() => ({
    opacity: interpolate(saludAnimada.value, [0, 40, 100], [0, 0.3, 0.85], Extrapolation.CLAMP),
  }));

  // La boca pasa de una curva triste a una sonrisa moviendo su punto de control.
  const propsBoca = useAnimatedProps(() => {
    const curvatura = interpolate(saludAnimada.value, [0, 100], [118, 156], Extrapolation.CLAMP);
    return { d: `M72,132 Q100,${curvatura} 128,132` };
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
        <Svg width={180} height={180} viewBox="0 0 200 200">
          {/* brote de hojas, más redondeado y con 3 hojitas */}
          <Path d="M100,38 C93,15 68,8 56,18 C68,32 84,37 100,38 Z" fill={colores.primario} />
          <Path d="M100,38 C107,15 132,8 144,18 C132,32 116,37 100,38 Z" fill={colores.primarioOscuro} />
          <Path d="M100,34 C98,18 100,8 100,2 C102,8 104,18 100,34 Z" fill={colores.primarioOscuro} />

          {/* cuerpo: óvalo ancho y redondeado = más "gordito" que un blob alargado */}
          <AnimatedEllipse animatedProps={propsCuerpo} cx="100" cy="115" rx="78" ry="68" />

          {/* brillo superior para dar aspecto pulido/brillante, no plano */}
          <Ellipse cx="72" cy="80" rx="28" ry="16" fill="#FFFFFF" opacity={0.28} transform="rotate(-25 72 80)" />

          {/* mofletes sonrosados */}
          <AnimatedEllipse animatedProps={propsMofletes} cx="58" cy="132" rx="14" ry="9" fill={colores.mascotaMofletes} />
          <AnimatedEllipse animatedProps={propsMofletes} cx="142" cy="132" rx="14" ry="9" fill={colores.mascotaMofletes} />

          {/* ojos grandes con brillo, para más ternura */}
          <Circle cx="74" cy="104" r="11" fill={colores.texto} />
          <Circle cx="126" cy="104" r="11" fill={colores.texto} />
          <Circle cx="70.5" cy="100" r="3.2" fill="#FFFFFF" />
          <Circle cx="122.5" cy="100" r="3.2" fill="#FFFFFF" />

          {/* boca animada */}
          <AnimatedPath
            animatedProps={propsBoca}
            stroke={colores.texto}
            strokeWidth={5.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <TouchableOpacity onPress={onPresionarNombre} style={estilos.filaNombre} activeOpacity={0.6}>
        <Text style={estilos.nombre}>{nombre}</Text>
        <Text style={estilos.lapiz}>✏️</Text>
      </TouchableOpacity>

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
    top: espaciado.lg - 20,
    width: 240,
    height: 240,
    borderRadius: 120,
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
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: espaciado.sm,
    gap: espaciado.xs,
  },
  nombre: {
    ...tipografia.titulo,
    fontFamily: fuentes.extraNegrita,
  },
  lapiz: {
    fontSize: 14,
    opacity: 0.6,
  },
  mensaje: {
    ...tipografia.subtitulo,
    textAlign: 'center',
    marginTop: espaciado.xs,
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
