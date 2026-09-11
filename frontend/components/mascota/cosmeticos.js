import { Path, Ellipse, Circle, Rect, Line } from 'react-native-svg';

// Catálogo visual de complementos. Los costes viven en el backend
// (GET /cosmeticos-mascota) — esto es solo lo necesario para mostrarlos y dibujarlos.
export const COSMETICOS = {
  gorro_fiesta: { nombre: 'Gorro de fiesta', emoji: '🎉', slot: 'sombrero' },
  corona: { nombre: 'Corona', emoji: '👑', slot: 'sombrero' },
  gafas_sol: { nombre: 'Gafas de sol', emoji: '🕶️', slot: 'gafas' },
  gafas_pasta: { nombre: 'Gafas de pasta', emoji: '🤓', slot: 'gafas' },
  pajarita: { nombre: 'Pajarita', emoji: '🎀', slot: 'cuello' },
  bufanda: { nombre: 'Bufanda', emoji: '🧣', slot: 'cuello' },
};

function Sombrero({ id }) {
  if (id === 'gorro_fiesta') {
    return (
      <>
        <Ellipse cx="100" cy="38" rx="34" ry="7" fill="#E85D9C" />
        <Path d="M100,-18 L131,38 L69,38 Z" fill="#FF6FA8" />
        <Circle cx="88" cy="18" r="3.5" fill="#FFE374" />
        <Circle cx="108" cy="0" r="3.5" fill="#7ED9C4" />
        <Circle cx="95" cy="-8" r="3.5" fill="#FFE374" />
        <Circle cx="100" cy="-20" r="7" fill="#FFD93D" />
      </>
    );
  }
  if (id === 'corona') {
    return (
      <>
        <Path
          d="M62,46 L62,18 L78,34 L100,6 L122,34 L138,18 L138,46 Z"
          fill="#FFD34D"
          stroke="#C99A1F"
          strokeWidth={2}
        />
        <Circle cx="78" cy="26" r="4" fill="#D64550" />
        <Circle cx="100" cy="18" r="5" fill="#4A90D9" />
        <Circle cx="122" cy="26" r="4" fill="#D64550" />
      </>
    );
  }
  return null;
}

function Gafas({ id }) {
  if (id === 'gafas_sol') {
    return (
      <>
        <Line x1="90" y1="103" x2="110" y2="103" stroke="#2B2B2B" strokeWidth={3} />
        <Ellipse cx="74" cy="104" rx="17" ry="14" fill="#2B2B2B" opacity={0.92} />
        <Ellipse cx="126" cy="104" rx="17" ry="14" fill="#2B2B2B" opacity={0.92} />
        <Ellipse cx="70" cy="99" rx="5" ry="3" fill="#FFFFFF" opacity={0.25} />
        <Ellipse cx="122" cy="99" rx="5" ry="3" fill="#FFFFFF" opacity={0.25} />
      </>
    );
  }
  if (id === 'gafas_pasta') {
    return (
      <>
        <Line x1="88" y1="104" x2="112" y2="104" stroke="#3A342C" strokeWidth={4} />
        <Circle cx="74" cy="104" r="16" fill="none" stroke="#3A342C" strokeWidth={4.5} />
        <Circle cx="126" cy="104" r="16" fill="none" stroke="#3A342C" strokeWidth={4.5} />
      </>
    );
  }
  return null;
}

function Cuello({ id }) {
  if (id === 'pajarita') {
    return (
      <>
        <Path d="M78,170 L100,178 L78,187 Z" fill="#D64550" />
        <Path d="M122,170 L100,178 L122,187 Z" fill="#D64550" />
        <Circle cx="100" cy="178" r="5.5" fill="#B23A44" />
      </>
    );
  }
  if (id === 'bufanda') {
    return (
      <>
        <Path d="M50,168 C70,182 130,182 150,168 L150,180 C130,194 70,194 50,180 Z" fill="#4A7FBD" />
        <Rect x="92" y="180" width="16" height="30" rx="4" fill="#3F6BA0" />
        <Rect x="92" y="204" width="16" height="6" fill="#2F5384" />
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
