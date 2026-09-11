import { Path, Ellipse } from 'react-native-svg';

// Catálogo visual de especies. Los costes en monedas viven en el backend
// (GET /especies-mascota) — esto es solo lo necesario para dibujar cada una.
export const ESPECIES = {
  manzana: { nombre: 'Manzana', colorCuerpo: '#2FA35D', colorOscuro: '#1F7A45' },
  oso: { nombre: 'Osito', colorCuerpo: '#B5793B', colorOscuro: '#8C5A26' },
  capibara: { nombre: 'Capibara', colorCuerpo: '#C9A468', colorOscuro: '#A98247' },
  zorro: { nombre: 'Zorro', colorCuerpo: '#E2733D', colorOscuro: '#B5551F' },
  panda: { nombre: 'Panda', colorCuerpo: '#F2F2ED', colorOscuro: '#2B2B2B' },
  conejo: { nombre: 'Conejo', colorCuerpo: '#E8C9D6', colorOscuro: '#D69FB3' },
};

// Orejas / brote: se dibujan ANTES que la cabeza, para que asomen detrás de
// ella. Coordenadas pensadas para una cabeza centrada en (100, 95) r=56.
export function Orejas({ especie, colorOscuro }) {
  switch (especie) {
    case 'oso':
      return (
        <>
          <Ellipse cx="60" cy="58" rx="23" ry="23" fill={colorOscuro} />
          <Ellipse cx="140" cy="58" rx="23" ry="23" fill={colorOscuro} />
        </>
      );
    case 'capibara':
      return (
        <>
          <Ellipse cx="64" cy="66" rx="14" ry="10" fill={colorOscuro} transform="rotate(-12 64 66)" />
          <Ellipse cx="136" cy="66" rx="14" ry="10" fill={colorOscuro} transform="rotate(12 136 66)" />
        </>
      );
    case 'zorro':
      return (
        <>
          <Path d="M62,70 L45,16 L88,55 Z" fill={colorOscuro} />
          <Path d="M138,70 L155,16 L112,55 Z" fill={colorOscuro} />
        </>
      );
    case 'panda':
      return (
        <>
          <Ellipse cx="58" cy="56" rx="24" ry="24" fill={colorOscuro} />
          <Ellipse cx="142" cy="56" rx="24" ry="24" fill={colorOscuro} />
        </>
      );
    case 'conejo':
      return (
        <>
          <Ellipse cx="78" cy="36" rx="14" ry="32" fill={colorOscuro} transform="rotate(-8 78 36)" />
          <Ellipse cx="122" cy="36" rx="14" ry="32" fill={colorOscuro} transform="rotate(8 122 36)" />
          <Ellipse cx="78" cy="38" rx="7" ry="23" fill="#F7A8BE" transform="rotate(-8 78 38)" />
          <Ellipse cx="122" cy="38" rx="7" ry="23" fill="#F7A8BE" transform="rotate(8 122 38)" />
        </>
      );
    case 'manzana':
    default:
      return (
        <>
          <Path d="M100,42 C99,26 100,17 100,12 C101,17 102,26 100,42 Z" fill={colorOscuro} />
          <Path d="M100,40 C94,23 73,17 63,25 C73,36 86,40 100,40 Z" fill={colorOscuro} />
          <Path d="M100,40 C106,23 127,17 137,25 C127,36 114,40 100,40 Z" fill={colorOscuro} />
        </>
      );
  }
}

// Marcas de la cara (hocico, antifaz...): se dibujan encima del cuerpo pero
// antes que ojos/mofletes, para que queden "detrás" de esos detalles.
export function Marcas({ especie, colorOscuro }) {
  switch (especie) {
    case 'oso':
    case 'capibara':
      return <Ellipse cx="100" cy="120" rx="23" ry="16" fill="#FFFFFF" opacity={0.35} />;
    case 'zorro':
      return <Ellipse cx="100" cy="122" rx="21" ry="19" fill="#FFFFFF" opacity={0.5} />;
    case 'panda':
      return (
        <>
          <Ellipse cx="80" cy="90" rx="16" ry="20" fill={colorOscuro} transform="rotate(-10 80 90)" />
          <Ellipse cx="120" cy="90" rx="16" ry="20" fill={colorOscuro} transform="rotate(10 120 90)" />
        </>
      );
    default:
      return null;
  }
}
