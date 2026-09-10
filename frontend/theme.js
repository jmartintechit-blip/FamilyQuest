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

  // Terracota: color de acento para destacar puntos, alertas suaves, la mascota
  acento: '#D98A4E',
  acentoSuave: '#F5DFC7',

  // Textos: marrón oscuro cálido en vez de negro puro
  texto: '#3A342C',
  textoSuave: '#7A7266',
  textoSobrePrimario: '#FFFFFF',

  borde: '#E6DCC8',
  error: '#C0524A',
  errorSuave: '#F6DEDB',

  // Estados de la mascota (salud 0-100), reutilizados en la tarjeta de mascota
  mascota: {
    genial: { fondo: '#FFF4D6', texto: '#8A6A1D' },
    bien: { fondo: '#EAF4E1', texto: '#3F6B40' },
    regular: { fondo: '#FBE8E0', texto: '#A85B3B' },
    mal: { fondo: '#F5E0DC', texto: '#8C3D2E' },
  },
};

export const tipografia = {
  tituloGrande: { fontSize: 28, fontWeight: '700', color: colores.texto },
  titulo: { fontSize: 22, fontWeight: '700', color: colores.texto },
  subtitulo: { fontSize: 18, fontWeight: '600', color: colores.texto },
  cuerpo: { fontSize: 16, fontWeight: '400', color: colores.texto },
  cuerpoSuave: { fontSize: 16, fontWeight: '400', color: colores.textoSuave },
  chico: { fontSize: 14, fontWeight: '400', color: colores.textoSuave },
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
