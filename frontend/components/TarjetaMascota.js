import { View, Text, StyleSheet } from 'react-native';
import { colores, tipografia, espaciado, radios } from '../theme';

// Misma lógica que ya tenías en App.js (estadoMascota), solo que ahora
// devuelve la clave del estado para poder buscar sus colores en el theme.
function calcularEstado(salud) {
  if (salud >= 80) return { emoji: '🌻', mensaje: '¡Estoy genial, gracias por cuidarme!', clave: 'genial' };
  if (salud >= 50) return { emoji: '🌿', mensaje: 'Voy tirando, ¿me ayudas un poco?', clave: 'bien' };
  if (salud >= 20) return { emoji: '🥀', mensaje: 'Me vendría bien una ayudita...', clave: 'regular' };
  return { emoji: '🍂', mensaje: 'Necesito mucho cariño ahora mismo', clave: 'mal' };
}

export default function TarjetaMascota({ salud }) {
  const { emoji, mensaje, clave } = calcularEstado(salud);
  const colorEstado = colores.mascota[clave];

  return (
    <View style={[estilos.tarjeta, { backgroundColor: colorEstado.fondo }]}>
      <Text style={estilos.emoji}>{emoji}</Text>
      <Text style={[estilos.mensaje, { color: colorEstado.texto }]}>{mensaje}</Text>

      <View style={estilos.barraFondo}>
        <View
          style={[
            estilos.barraRelleno,
            { width: `${Math.max(0, Math.min(100, salud))}%`, backgroundColor: colorEstado.texto },
          ]}
        />
      </View>
      <Text style={[estilos.textoSalud, { color: colorEstado.texto }]}>Salud: {salud}/100</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    width: '100%',
    borderRadius: radios.lg,
    padding: espaciado.lg,
    alignItems: 'center',
    marginBottom: espaciado.md,
  },
  emoji: {
    fontSize: 56,
    marginBottom: espaciado.sm,
  },
  mensaje: {
    ...tipografia.subtitulo,
    textAlign: 'center',
    marginBottom: espaciado.md,
  },
  barraFondo: {
    width: '100%',
    height: 10,
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
