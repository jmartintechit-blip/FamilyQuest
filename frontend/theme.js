// Identidad visual de la app. A partir de la Fase 3 los colores y el tamaño
// de letra dejan de ser fijos: viven en dos paletas (clara/oscura) y una
// función que arma la tipografía, y el que decide cuál usar en cada momento
// es TemaContext (ver context/TemaContext.js) según el modo y el tamaño de
// letra que haya elegido la familia. Aquí solo se define el contenido de
// cada paleta — quien quiera los valores "en vivo" debe usar useTema().

export const paletaClara = {
  fondo: '#F6FAF7',
  superficie: '#FFFFFF',
  superficieSuave: '#EEF4F0',

  primario: '#2FA35D',
  primarioOscuro: '#1F7A45',
  primarioSuave: '#DBF3E3',

  acento: '#FF8A65',
  acentoSuave: '#FFE4D9',

  dorado: '#FFC94D',
  doradoSuave: '#FFF3D6',
  doradoOscuro: '#8A5A00',

  texto: '#2B2E2C',
  textoSuave: '#767F7A',
  textoSobrePrimario: '#FFFFFF',

  borde: '#E1E8E3',
  error: '#E0574F',
  errorSuave: '#FCE4E1',
};

export const paletaOscura = {
  fondo: '#121814',
  superficie: '#1C2420',
  superficieSuave: '#242D28',

  primario: '#3DBE75',
  primarioOscuro: '#2FA35D',
  primarioSuave: '#1F3A2A',

  acento: '#FF9670',
  acentoSuave: '#3A2620',

  dorado: '#FFC94D',
  doradoSuave: '#3A2E10',
  doradoOscuro: '#FFD98A',

  texto: '#EDF2EF',
  textoSuave: '#9BA79F',
  textoSobrePrimario: '#0D140F',

  borde: '#2E3830',
  error: '#FF6B62',
  errorSuave: '#3A2220',
};

// Colores propios de la mascota: no cambian con el modo claro/oscuro,
// porque son parte de su identidad (salud, mofletes, rasgos), no de la interfaz.
export const colorMascota = {
  gradiente: ['#F2765C', '#FFC94D', '#2FA35D'],
  mofletes: '#FF9E8F',
  rasgos: '#2B2E2C', // ojos y boca: siempre oscuros, en cualquier modo
};

// Nombres de fuente de @expo-google-fonts/nunito. Se cargan de forma async
// en App.js con useFonts antes de mostrar la app (ver App.js).
export const fuentes = {
  regular: 'Nunito_400Regular',
  medio: 'Nunito_600SemiBold',
  negrita: 'Nunito_700Bold',
  extraNegrita: 'Nunito_800ExtraBold',
};

// Tamaños de letra disponibles en Ajustes. El multiplicador escala todos los
// tamaños de golpe, sin tener que definir una escala nueva por cada opción.
export const TAMANOS_FUENTE = {
  normal: { etiqueta: 'Normal', escala: 1 },
  grande: { etiqueta: 'Grande', escala: 1.15 },
  extra: { etiqueta: 'Muy grande', escala: 1.3 },
};

// Arma los estilos de texto para una paleta y una escala concretas.
export function crearTipografia(colores, escala = 1) {
  return {
    tituloGrande: { fontSize: 28 * escala, fontFamily: fuentes.extraNegrita, color: colores.texto },
    titulo: { fontSize: 22 * escala, fontFamily: fuentes.negrita, color: colores.texto },
    subtitulo: { fontSize: 18 * escala, fontFamily: fuentes.medio, color: colores.texto },
    cuerpo: { fontSize: 16 * escala, fontFamily: fuentes.regular, color: colores.texto },
    cuerpoSuave: { fontSize: 16 * escala, fontFamily: fuentes.regular, color: colores.textoSuave },
    chico: { fontSize: 14 * escala, fontFamily: fuentes.regular, color: colores.textoSuave },
  };
}

export const espaciado = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radios = {
  sm: 8,
  md: 14,
  lg: 22,
  completo: 999,
};
