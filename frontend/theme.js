// Identidad visual de la app: un solo lugar donde vive cada color, tamaño de
// texto y espaciado. Si mañana queremos cambiar "el look" de toda la app,
// se toca este archivo y no cada pantalla por separado.

export const colores = {
  // Fondo general: blanco roto con un toque frío, para una sensación más
  // "limpia" que el crema cálido anterior (que leía un poco vintage/rústico)
  fondo: '#F6FAF7',
  // Superficie de tarjetas y inputs
  superficie: '#FFFFFF',
  superficieSuave: '#EEF4F0',

  // Verde más vivo y saturado que antes — menos "salvia apagada", más fresco
  primario: '#2FA35D',
  primarioOscuro: '#1F7A45',
  primarioSuave: '#DBF3E3',

  // Coral cálido: color de acento para destacar puntos, alertas suaves
  acento: '#FF8A65',
  acentoSuave: '#FFE4D9',

  // Dorado/miel: reservado para el "modo caos" (eventos especiales tipo Hora Dorada)
  dorado: '#FFC94D',
  doradoSuave: '#FFF3D6',
  doradoOscuro: '#8A5A00',

  // Textos: gris muy oscuro neutro (ni negro puro ni marrón cálido)
  texto: '#2B2E2C',
  textoSuave: '#767F7A',
  textoSobrePrimario: '#FFFFFF',

  borde: '#E1E8E3',
  error: '#E0574F',
  errorSuave: '#FCE4E1',

  // Gradiente continuo de salud de la mascota (0 -> 50 -> 100), usado con
  // interpolateColor para que el color cambie de forma gradual, no a saltos.
  // Ahora usa colores mucho más vivos y saturados en vez de tonos apagados.
  mascotaGradiente: ['#F2765C', '#FFC94D', '#2FA35D'],
  mascotaGlow: '#FFF3D6',
  mascotaMofletes: '#FF9E8F',
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
