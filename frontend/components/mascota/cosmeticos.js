import { Path, Ellipse, Circle, Rect, Line } from 'react-native-svg';

// Catálogo visual de complementos. Los costes viven en el backend
// (GET /cosmeticos-mascota) — esto es solo lo necesario para mostrarlos y dibujarlos.
export const COSMETICOS = {
  gorro_fiesta: { nombre: 'Gorro de fiesta', icono: 'gift-outline', slot: 'sombrero' },
  corona: { nombre: 'Corona', icono: 'diamond-outline', slot: 'sombrero' },
  gafas_sol: { nombre: 'Gafas de sol', icono: 'glasses-outline', slot: 'gafas' },
  gafas_pasta: { nombre: 'Gafas de pasta', icono: 'glasses-outline', slot: 'gafas' },
  pajarita: { nombre: 'Pajarita', icono: 'ellipse-outline', slot: 'cuello' },
  bufanda: { nombre: 'Bufanda', icono: 'shirt-outline', slot: 'cuello' },
};

// Coordenadas pensadas para una cabeza centrada en (100, 95) r=56.
function Sombrero({ id }) {
  if (id === 'gorro_fiesta') {
    return (
      <>
        <Ellipse cx="100" cy="42" rx="34" ry="7" fill="#E85D9C" />
        <Path d="M100,8 L131,42 L69,42 Z" fill="#FF6FA8" />
        <Circle cx="88" cy="26" r="3.5" fill="#FFE374" />
        <Circle cx="108" cy="12" r="3.5" fill="#7ED9C4" />
        <Circle cx="95" cy="18" r="3.5" fill="#FFE374" />
        <Circle cx="100" cy="6" r="7" fill="#FFD93D" />
      </>
    );
  }
  if (id === 'corona') {
    return (
      <>
        <Path
          d="M62,50 L62,22 L78,38 L100,10 L122,38 L138,22 L138,50 Z"
          fill="#FFD34D"
          stroke="#C99A1F"
          strokeWidth={2}
        />
        <Circle cx="78" cy="30" r="4" fill="#D64550" />
        <Circle cx="100" cy="22" r="5" fill="#4A90D9" />
        <Circle cx="122" cy="30" r="4" fill="#D64550" />
      </>
    );
  }
  return null;
}

function Gafas({ id }) {
  if (id === 'gafas_sol') {
    return (
      <>
        <Line x1="90" y1="91" x2="110" y2="91" stroke="#2B2B2B" strokeWidth={3} />
        <Ellipse cx="74" cy="92" rx="17" ry="14" fill="#2B2B2B" opacity={0.92} />
        <Ellipse cx="126" cy="92" rx="17" ry="14" fill="#2B2B2B" opacity={0.92} />
        <Ellipse cx="70" cy="87" rx="5" ry="3" fill="#FFFFFF" opacity={0.25} />
        <Ellipse cx="122" cy="87" rx="5" ry="3" fill="#FFFFFF" opacity={0.25} />
      </>
    );
  }
  if (id === 'gafas_pasta') {
    return (
      <>
        <Line x1="88" y1="92" x2="112" y2="92" stroke="#3A342C" strokeWidth={4} />
        <Circle cx="74" cy="92" r="16" fill="none" stroke="#3A342C" strokeWidth={4.5} />
        <Circle cx="126" cy="92" r="16" fill="none" stroke="#3A342C" strokeWidth={4.5} />
      </>
    );
  }
  return null;
}

function Cuello({ id }) {
  if (id === 'pajarita') {
    return (
      <>
        <Path d="M78,140 L100,148 L78,157 Z" fill="#D64550" />
        <Path d="M122,140 L100,148 L122,157 Z" fill="#D64550" />
        <Circle cx="100" cy="148" r="5.5" fill="#B23A44" />
      </>
    );
  }
  if (id === 'bufanda') {
    return (
      <>
        <Path d="M50,138 C70,152 130,152 150,138 L150,150 C130,164 70,164 50,150 Z" fill="#4A7FBD" />
        <Rect x="92" y="150" width="16" height="30" rx="4" fill="#3F6BA0" />
        <Rect x="92" y="174" width="16" height="6" fill="#2F5384" />
      </>
    );
  }
  return null;
}

// equipados: { sombrero, gafas, cuello } — ids del catálogo o null/undefined
export default function Cosmeticos({ equipados = {} }) {
  return (
    <>
      <Cuello id={equipados.cuello} />
      <Sombrero id={equipados.sombrero} />
      <Gafas id={equipados.gafas} />
    </>
  );
}
