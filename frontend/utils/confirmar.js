import { Alert, Platform } from 'react-native';

// Pide confirmación antes de una acción destructiva. En móvil usa el diálogo nativo;
// Alert.alert no admite botones en web, así que ahí se usa window.confirm.
export function confirmar({ titulo, mensaje, textoConfirmar = 'Aceptar', alConfirmar }) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensaje}`)) alConfirmar();
    return;
  }
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoConfirmar, style: 'destructive', onPress: alConfirmar },
  ]);
}
