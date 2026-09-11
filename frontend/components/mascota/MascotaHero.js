import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
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
import { colorMascota } from '../../theme';
import { useTema } from '../../context/TemaContext';
import { ESPECIES, Orejas, Marcas } from './especies';
import Cosmeticos from './cosmeticos';

// react-native-svg no anima sus props por sí solo: envolvemos las formas con
// Reanimated para poder cambiar su "fill" o su "d" cuadro a cuadro.
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Color al que tiende CUALQUIER especie cuando está muy débil — la salud
// "apaga" el color propio de la especie en vez de sustituirlo por otro.
const COLOR_APAGADO = '#9E9689';

function mensajePorSalud(salud) {
  if (salud >= 80) return '¡Estoy genial, gracias por cuidarme!';
  if (salud >= 50) return 'Voy tirando, ¿me ayudas un poco?';
  if (salud >= 20) return 'Me vendría bien una ayudita...';
  return 'Necesito mucho cariño ahora mismo';
}

// puntosFlotantes: [{ id, texto, color }] — mensajes tipo "+5" que aparecen
// un instante sobre la mascota cuando se marca una tarea, y luego desaparecen.
// nombre / onPresionarNombre: el nombre que le puso la familia a la mascota,
// tocable para poder cambiarlo. especie: 'manzana' | 'oso' | 'capibara' | ...
export default function MascotaHero({ salud, puntosFlotantes = [], nombre, onPresionarNombre, especie = 'manzana', cosmeticosEquipados }) {
  const { colores, tipografia, fuentes, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, fuentes, espaciado, radios);
  const info = ESPECIES[especie] || ESPECIES.manzana;
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
    const amplitudRebote = interpolate(saludAnimada.value, [0, 100], [0.006, 0.03], Extrapolation.CLAMP);
    const escala = 1 + respiracion.value * amplitudRebote;
    const inclinacion = interpolate(saludAnimada.value, [0, 100], [-5, 0], Extrapolation.CLAMP);
    return { transform: [{ scale: escala }, { rotate: `${inclinacion}deg` }] };
  });

  const estiloGlow = useAnimatedStyle(() => {
    const opacidad = interpolate(saludAnimada.value, [0, 50, 100], [0, 0.15, 0.6], Extrapolation.CLAMP);
    const escalaGlow = 1 + respiracion.value * 0.06;
    return { opacity: opacidad, transform: [{ scale: escalaGlow }] };
  });

  // El color propio de la especie se "apaga" con una capa gris encima cuando
  // la salud es baja, en vez de sustituirlo por un color que no le pertenece.
  const propsApagadoCuerpo = useAnimatedProps(() => ({
    opacity: interpolate(saludAnimada.value, [0, 100], [0.6, 0], Extrapolation.CLAMP),
  }));
  const propsApagadoCabeza = useAnimatedProps(() => ({
    opacity: interpolate(saludAnimada.value, [0, 100], [0.6, 0], Extrapolation.CLAMP),
  }));

  // Los mofletes solo se notan bien cuando está sano y contento.
  const propsMofletes = useAnimatedProps(() => ({
    opacity: interpolate(saludAnimada.value, [0, 40, 100], [0, 0.3, 0.85], Extrapolation.CLAMP),
  }));

  // La boca pasa de una curva triste a una sonrisa moviendo su punto de control.
  const propsBoca = useAnimatedProps(() => {
    const curvatura = interpolate(saludAnimada.value, [0, 100], [108, 146], Extrapolation.CLAMP);
    return { d: `M81,122 Q100,${curvatura} 119,122` };
  });

  const estiloBarra = useAnimatedStyle(() => ({
    width: `${saludAnimada.value}%`,
    backgroundColor: interpolateColor(saludAnimada.value, [0, 50, 100], colorMascota.gradiente),
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
        <Svg width={168} height={235} viewBox="0 0 200 280">
          {/* cuerpo */}
          <Ellipse cx="100" cy="185" rx="80" ry="88" fill={info.colorCuerpo} />
          <AnimatedEllipse animatedProps={propsApagadoCuerpo} cx="100" cy="185" rx="80" ry="88" fill={COLOR_APAGADO} />

          {/* barriga: mancha más clara para dar volumen, sin usar degradados */}
          <Ellipse cx="100" cy="204" rx="42" ry="52" fill="#FFFFFF" opacity={0.16} />

          {/* pies, encima del cuerpo para que se vean enteros */}
          <Ellipse cx="70" cy="260" rx="23" ry="15" fill={info.colorOscuro} />
          <Ellipse cx="130" cy="260" rx="23" ry="15" fill={info.colorOscuro} />

          {/* brazos, encima del cuerpo para que se vean enteros */}
          <Ellipse cx="34" cy="150" rx="18" ry="36" fill={info.colorOscuro} transform="rotate(-24 34 150)" />
          <Ellipse cx="166" cy="150" rx="18" ry="36" fill={info.colorOscuro} transform="rotate(24 166 150)" />

          <Orejas especie={especie} colorCuerpo={info.colorCuerpo} colorOscuro={info.colorOscuro} />

          {/* cabeza */}
          <Circle cx="100" cy="95" r="56" fill={info.colorCuerpo} />
          <AnimatedCircle animatedProps={propsApagadoCabeza} cx="100" cy="95" r="56" fill={COLOR_APAGADO} />

          {/* brillo superior para dar aspecto pulido/brillante, no plano */}
          <Ellipse cx="76" cy="66" rx="24" ry="14" fill="#FFFFFF" opacity={0.25} transform="rotate(-25 76 66)" />

          <Marcas especie={especie} colorCuerpo={info.colorCuerpo} colorOscuro={info.colorOscuro} />

          {/* mofletes sonrosados */}
          <AnimatedEllipse animatedProps={propsMofletes} cx="69" cy="110" rx="11" ry="7" fill={colorMascota.mofletes} />
          <AnimatedEllipse animatedProps={propsMofletes} cx="131" cy="110" rx="11" ry="7" fill={colorMascota.mofletes} />

          {/* ojos grandes con brillo, para más ternura */}
          <Circle cx="81" cy="92" r="9" fill={colorMascota.rasgos} />
          <Circle cx="119" cy="92" r="9" fill={colorMascota.rasgos} />
          <Circle cx="78" cy="89" r="2.4" fill="#FFFFFF" />
          <Circle cx="116" cy="89" r="2.4" fill="#FFFFFF" />

          {/* boca animada */}
          <AnimatedPath
            animatedProps={propsBoca}
            stroke={colorMascota.rasgos}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />

          <Cosmeticos equipados={cosmeticosEquipados} />
        </Svg>
      </Animated.View>

      <TouchableOpacity onPress={onPresionarNombre} style={estilos.filaNombre} activeOpacity={0.6}>
        <Text style={estilos.nombre}>{nombre}</Text>
        <Ionicons name="pencil-outline" size={14} color={colores.textoSuave} />
      </TouchableOpacity>

      <Text style={estilos.mensaje}>{mensajePorSalud(salud)}</Text>

      <View style={estilos.barraFondo}>
        <Animated.View style={[estilos.barraRelleno, estiloBarra]} />
      </View>
      <Text style={estilos.textoSalud}>Salud: {salud}/100</Text>
    </View>
  );
}

function crearEstilos(colores, tipografia, fuentes, espaciado, radios) {
  return StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      paddingVertical: espaciado.lg,
    },
    glow: {
      position: 'absolute',
      top: espaciado.lg - 10,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: colorMascota.glow,
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
}
