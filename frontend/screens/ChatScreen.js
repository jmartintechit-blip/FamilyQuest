import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import CampoTexto from '../components/CampoTexto';
import BurbujaChat from '../components/BurbujaChat';

export default function ChatScreen() {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado, radios } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado, radios);
  const [mensajes, setMensajes] = useState([]);
  const [textoMensaje, setTextoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hayAnteriores, setHayAnteriores] = useState(false);
  const scrollRef = useRef(null);
  const cargandoAnteriores = useRef(false);

  // El servidor devuelve páginas de 50; si llega una página llena, puede haber más atrás.
  const TAMANO_PAGINA = 50;

  async function cargarMensajes(antes) {
    try {
      const query = antes ? `?antes=${antes}` : '';
      const respuesta = await fetch(`${URL_BASE}/familias/${usuario.familia_id}/mensajes${query}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      setHayAnteriores(datos.length === TAMANO_PAGINA);
      if (antes) {
        cargandoAnteriores.current = true;
        setMensajes((actuales) => [...datos, ...actuales]);
      } else {
        setMensajes(datos);
      }
    } catch (error) {
      console.log('Error cargando mensajes', error);
    }
  }

  useEffect(() => {
    const nuevoSocket = io(URL_BASE, { auth: { token } });
    nuevoSocket.emit('unirse_familia', usuario.familia_id);

    nuevoSocket.on('mensaje_nuevo', (mensaje) => {
      setMensajes((mensajesActuales) => [...mensajesActuales, mensaje]);
    });

    cargarMensajes();

    return () => {
      nuevoSocket.disconnect();
    };
  }, [usuario.familia_id, token]);

  // Cada vez que hay mensajes nuevos, bajamos la vista al final para que se
  // vean sin tener que desplazar manualmente (antes había que hacerlo a mano).
  function alCambiarContenido() {
    // Al cargar mensajes antiguos no hay que saltar al final.
    if (cargandoAnteriores.current) {
      cargandoAnteriores.current = false;
      return;
    }
    scrollRef.current?.scrollToEnd({ animated: true });
  }

  async function enviarMensaje() {
    const texto = textoMensaje.trim();
    if (!texto || enviando) return;

    setEnviando(true);
    setTextoMensaje('');

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
          texto,
        }),
      });
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo enviar el mensaje');
      setTextoMensaje(texto);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={[tipografia.tituloGrande, styles.titulo]}>Chat familiar</Text>

      <ScrollView
        ref={scrollRef}
        style={styles.cajaChat}
        contentContainerStyle={{ padding: espaciado.md, flexGrow: 1 }}
        onContentSizeChange={alCambiarContenido}
      >
        {hayAnteriores && (
          <TouchableOpacity
            onPress={() => cargarMensajes(mensajes[0].id)}
            accessibilityRole="button"
            accessibilityLabel="Cargar mensajes anteriores"
            style={styles.botonAnteriores}
          >
            <Text style={tipografia.cuerpoSuave}>Cargar mensajes anteriores</Text>
          </TouchableOpacity>
        )}
        {mensajes.length === 0 ? (
          <View style={styles.vacio}>
            <Ionicons name="chatbubbles-outline" size={40} color={colores.textoSuave} style={{ marginBottom: espaciado.xs }} />
            <Text style={tipografia.cuerpoSuave}>Aún no hay mensajes. ¡Escribe el primero!</Text>
          </View>
        ) : (
          mensajes.map((mensaje) => (
            <BurbujaChat key={mensaje.id} mensaje={mensaje} esPropio={mensaje.usuario_id === usuario.id} />
          ))
        )}
      </ScrollView>

      <View style={styles.filaInput}>
        <View style={{ flex: 1 }}>
          <CampoTexto
            placeholder="Escribe un mensaje..."
            value={textoMensaje}
            onChangeText={setTextoMensaje}
            onSubmitEditing={enviarMensaje}
            returnKeyType="send"
            blurOnSubmit={false}
          />
        </View>
        <TouchableOpacity onPress={enviarMensaje} style={[styles.botonEnviar, !textoMensaje.trim() && styles.botonEnviarDeshabilitado]}>
          <Text style={styles.textoBotonEnviar}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
      paddingTop: 60,
    },
    titulo: {
      paddingHorizontal: espaciado.md,
      marginBottom: espaciado.sm,
    },
    botonAnteriores: {
      alignItems: 'center',
      padding: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    cajaChat: {
      flex: 1,
    },
    vacio: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: espaciado.xs,
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
    botonEnviarDeshabilitado: {
      opacity: 0.5,
    },
    textoBotonEnviar: {
      ...tipografia.cuerpo,
      color: colores.textoSobrePrimario,
    },
  });
}
