import { Path, Ellipse } from 'react-native-svg';

// Catálogo visual de especies. Los costes en monedas viven en el backend
// (GET /especies-mascota) — esto es solo lo necesario para dibujar cada una.
export const ESPECIES = {
  manzana: { nombre: 'Manzana', emoji: '🍎', colorCuerpo: '#2FA35D', colorOscuro: '#1F7A45' },
  oso: { nombre: 'Osito', emoji: '🐻', colorCuerpo: '#B5793B', colorOscuro: '#8C5A26' },
  capibara: { nombre: 'Capibara', emoji: '🐹', colorCuerpo: '#C9A468', colorOscuro: '#A98247' },
  zorro: { nombre: 'Zorro', emoji: '🦊', colorCuerpo: '#E2733D', colorOscuro: '#B5551F' },
  panda: { nombre: 'Panda', emoji: '🐼', colorCuerpo: '#F2F2ED', colorOscuro: '#2B2B2B' },
  conejo: { nombre: 'Conejo', emoji: '🐰', colorCuerpo: '#E8C9D6', colorOscuro: '#D69FB3' },
};

// Orejas / brote: se dibujan ANTES que el cuerpo, para que asomen detrás de él.
export function Orejas({ especie, colorOscuro }) {
  switch (especie) {
    case 'oso':
      return (
        <>
          <Ellipse cx="54" cy="52" rx="23" ry="23" fill={colorOscuro} />
          <Ellipse cx="146" cy="52" rx="23" ry="23" fill={colorOscuro} />
        </>
      );
    case 'capibara':
      return (
        <>
          <Ellipse cx="58" cy="62" rx="13" ry="10" fill={colorOscuro} transform="rotate(-10 58 62)" />
          <Ellipse cx="142" cy="62" rx="13" ry="10" fill={colorOscuro} transform="rotate(10 142 62)" />
        </>
      );
    case 'zorro':
      return (
        <>
          <Path d="M48,68 L30,12 L74,52 Z" fill={colorOscuro} />
          <Path d="M152,68 L170,12 L126,52 Z" fill={colorOscuro} />
        </>
      );
    case 'panda':
      return (
        <>
          <Ellipse cx="52" cy="50" rx="24" ry="24" fill={colorOscuro} />
          <Ellipse cx="148" cy="50" rx="24" ry="24" fill={colorOscuro} />
        </>
      );
    case 'conejo':
      return (
        <>
          <Ellipse cx="74" cy="18" rx="15" ry="34" fill={colorOscuro} transform="rotate(-8 74 18)" />
          <Ellipse cx="126" cy="18" rx="15" ry="34" fill={colorOscuro} transform="rotate(8 126 18)" />
          <Ellipse cx="74" cy="20" rx="7" ry="24" fill="#F7A8BE" transform="rotate(-8 74 20)" />
          <Ellipse cx="126" cy="20" rx="7" ry="24" fill="#F7A8BE" transform="rotate(8 126 20)" />
        </>
      );
    case 'manzana':
    default:
      return (
        <>
          <Path d="M100,38 C93,15 68,8 56,18 C68,32 84,37 100,38 Z" fill={colorOscuro} />
          <Path d="M100,38 C107,15 132,8 144,18 C132,32 116,37 100,38 Z" fill={colorOscuro} />
          <Path d="M100,34 C98,18 100,8 100,2 C102,8 104,18 100,34 Z" fill={colorOscuro} />
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
      return <Ellipse cx="100" cy="140" rx="24" ry="17" fill="#FFFFFF" opacity={0.35} />;
    case 'zorro':
      return <Ellipse cx="100" cy="142" rx="22" ry="20" fill="#FFFFFF" opacity={0.5} />;
    case 'panda':
      return (
        <>
          <Ellipse cx="74" cy="103" rx="17" ry="21" fill={colorOscuro} transform="rotate(-8 74 103)" />
          <Ellipse cx="126" cy="103" rx="17" ry="21" fill={colorOscuro} transform="rotate(8 126 103)" />
        </>
      );
    default:
      return null;
  }
}
