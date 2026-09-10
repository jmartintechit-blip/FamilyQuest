// Identidad visual de la app: un solo lugar donde vive cada color, tamaño de
// texto y espaciado. Si mañana queremos cambiar "el look" de toda la app,
// se toca este archivo y no cada pantalla por separado.

export const colores = {
  // Fondo general: crema cálido, no blanco puro (menos "clínico")
  fondo: '#FBF6EC',
  // Superficie de tarjetas y inputs
  superficie: '#FFFFFF',
  superficieSuave: '#F3EEE1',

  // Verde salvia: color principal de acciones (botones, links activos)
  primario: '#5B8C5A',
  primarioOscuro: '#3F6B40',
  primarioSuave: '#DCEBDA',

  // Terracota: color de acento para destacar puntos, alertas suaves
  acento: '#D98A4E',
  acentoSuave: '#F5DFC7',

  // Dorado/miel: reservado para el "modo caos" (eventos especiales tipo Hora Dorada)
  dorado: '#E3A83B',
  doradoSuave: '#FBEBC9',
  doradoOscuro: '#96701F',

  // Textos: marrón oscuro cálido en vez de negro puro
  texto: '#3A342C',
  textoSuave: '#7A7266',
  textoSobrePrimario: '#FFFFFF',

  borde: '#E6DCC8',
  error: '#C0524A',
  errorSuave: '#F6DEDB',

  // Gradiente continuo de salud de la mascota (0 -> 50 -> 100), usado con
  // interpolateColor para que el color cambie de forma gradual, no a saltos.
  mascotaGradiente: ['#B85C4A', '#D9A45C', '#6FA96B'],
  mascotaGlow: '#FFE9A8',
};

// Nombres de fuente de @expo-google-fonts/nunito. Se cargan de forma async
// en App.js con useFonts antes de mostrar la app (ver App.js).
export const fuentes = {
  regular: 'Nunito_400Regular',
  medio: 'Nunito_600SemiBold',
  negrita: 'Nunito_700Bold',
  extraNegrita: 'Nunito_800ExtraBold',
};

export const tipografia = {
  tituloGrande: { fontSize: 28, fontFamily: fuentes.extraNegrita, color: colores.texto },
  titulo: { fontSize: 22, fontFamily: fuentes.negrita, color: colores.texto },
  subtitulo: { fontSize: 18, fontFamily: fuentes.medio, color: colores.texto },
  cuerpo: { fontSize: 16, fontFamily: fuentes.regular, color: colores.texto },
  cuerpoSuave: { fontSize: 16, fontFamily: fuentes.regular, color: colores.textoSuave },
  chico: { fontSize: 14, fontFamily: fuentes.regular, color: colores.textoSuave },
};

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
