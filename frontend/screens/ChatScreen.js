import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { io } from 'socket.io-client';
import { colores, tipografia, espaciado, radios } from '../theme';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import CampoTexto from '../components/CampoTexto';
import BurbujaChat from '../components/BurbujaChat';

export default function ChatScreen() {
  const { usuario, token } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [textoMensaje, setTextoMensaje] = useState('');

  async function cargarMensajes() {
    try {
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/mensajes`);
      const datos = await respuesta.json();
      setMensajes(datos);
    } catch (error) {
      console.log('Error cargando mensajes', error);
    }
  }

  useEffect(() => {
    const nuevoSocket = io(URL_BASE);
    nuevoSocket.emit('unirse_familia', usuario.familia_id);

    nuevoSocket.on('mensaje_nuevo', (mensaje) => {
      setMensajes((mensajesActuales) => [...mensajesActuales, mensaje]);
    });

    cargarMensajes();

    return () => {
      nuevoSocket.disconnect();
    };
  }, [usuario.familia_id]);

  async function enviarMensaje() {
    if (!textoMensaje.trim()) return;

    try {
      await fetch(`${URL_BASE}/mensajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          familia_id: usuario.familia_id,
          usuario_id: usuario.id,
          texto: textoMensaje,
        }),
      });

      setTextoMensaje('');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo enviar el mensaje');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[tipografia.tituloGrande, styles.titulo]}>Chat familiar</Text>

      <ScrollView style={styles.cajaChat} contentContainerStyle={{ padding: espaciado.md }}>
        {mensajes.map((mensaje) => (
          <BurbujaChat key={mensaje.id} mensaje={mensaje} esPropio={mensaje.usuario_id === usuario.id} />
        ))}
      </ScrollView>

      <View style={styles.filaInput}>
        <View style={{ flex: 1 }}>
          <CampoTexto placeholder="Escribe un mensaje..." value={textoMensaje} onChangeText={setTextoMensaje} />
        </View>
        <TouchableOpacity onPress={enviarMensaje} style={styles.botonEnviar}>
          <Text style={styles.textoBotonEnviar}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colores.fondo,
    paddingTop: 60,
  },
  titulo: {
    paddingHorizontal: espaciado.md,
    marginBottom: espaciado.sm,
  },
  cajaChat: {
    flex: 1,
  },
  filaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: espaciado.md,
    gap: espaciado.sm,
  },
  botonEnviar: {
    backgroundColor: colores.primario,
    borderRadius: radios.md,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.md,
  },
  textoBotonEnviar: {
    ...tipografia.cuerpo,
    color: colores.textoSobrePrimario,
  },
});
