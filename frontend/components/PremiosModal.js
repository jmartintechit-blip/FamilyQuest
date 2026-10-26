import { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { URL_BASE } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import BotonPrincipal from './BotonPrincipal';
import CampoTexto from './CampoTexto';
import { confirmar } from '../utils/confirmar';

// Tienda de premios: la familia gasta sus monedas compartidas en premios que define el
// administrador ("elegir la película"...). Cualquiera canjea; solo el administrador edita.
export default function PremiosModal({ visible, onCerrar, onCambio }) {
  const { usuario, token } = useAuth();
  const { colores, tipografia, espaciado, radios } = useTema();
  const estilos = crearEstilos(colores, tipografia, espaciado, radios);
  const [monedas, setMonedas] = useState(0);
  const [premios, setPremios] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [esAdmin, setEsAdmin] = useState(false);
  const [editando, setEditando] = useState(null); // { id?, nombre, costo } mientras se crea o edita
  const [mensaje, setMensaje] = useState(null); // { texto, error }

  const cabecera = { Authorization: `Bearer ${token}` };
  const base = `${URL_BASE}/familias/${usuario.familia_id}`;

  async function cargar() {
    try {
      const [rPremios, rCanjes, rMiembros] = await Promise.all([
        fetch(`${base}/premios`, { headers: cabecera }),
        fetch(`${base}/canjes?limite=3`, { headers: cabecera }),
        fetch(`${base}/usuarios`, { headers: cabecera }),
      ]);
      if (!rPremios.ok) throw new Error();
      const datos = await rPremios.json();
      setMonedas(datos.monedas);
      setPremios(datos.premios);
      if (rCanjes.ok) setCanjes((await rCanjes.json()).slice(0, 3));
      if (rMiembros.ok) setEsAdmin((await rMiembros.json()).some((m) => m.id === usuario.id && m.rol === 'admin'));
    } catch {
      setMensaje({ texto: 'No se pudo cargar la tienda. Comprueba la conexión.', error: true });
    }
  }

  useEffect(() => {
    if (visible) {
      setEditando(null);
      setMensaje(null);
      cargar();
    }
  }, [visible]);

  // Llama al servidor; muestra su error si lo hay y devuelve los datos o null.
  async function llamar(ruta, metodo, body) {
    try {
      const respuesta = await fetch(`${URL_BASE}${ruta}`, {
        method: metodo,
        headers: { ...cabecera, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ texto: datos.error, error: true });
        return null;
      }
      return datos;
    } catch {
      setMensaje({ texto: 'No se pudo conectar con el servidor.', error: true });
      return null;
    }
  }

  async function canjear(premio) {
    const datos = await llamar(`/premios/${premio.id}/canjear`, 'POST');
    if (!datos) return;
    setMensaje({ texto: datos.mensaje, error: false });
    cargar();
    if (onCambio) onCambio();
  }

  function pedirCanje(premio) {
    confirmar({
      titulo: `¿Canjear "${premio.nombre}"?`,
      mensaje: `Se gastarán ${premio.costo} monedas de toda la familia.`,
      textoConfirmar: 'Canjear',
      alConfirmar: () => canjear(premio),
    });
  }

  async function guardar() {
    const costo = parseInt(editando.costo, 10);
    if (!editando.nombre.trim() || !costo || costo <= 0) {
      setMensaje({ texto: 'Escribe un nombre y un coste mayor que 0.', error: true });
      return;
    }
    const cuerpo = { nombre: editando.nombre.trim(), costo };
    const datos = editando.id
      ? await llamar(`/premios/${editando.id}`, 'PUT', cuerpo)
      : await llamar('/premios', 'POST', { ...cuerpo, familia_id: usuario.familia_id });
    if (datos) {
      setEditando(null);
      setMensaje(null);
      cargar();
    }
  }

  function pedirEliminar(premio) {
    confirmar({
      titulo: `¿Eliminar "${premio.nombre}"?`,
      mensaje: 'Dejará de aparecer en la tienda. Los canjes ya hechos se conservan.',
      textoConfirmar: 'Eliminar',
      alConfirmar: async () => {
        if (await llamar(`/premios/${premio.id}`, 'DELETE')) cargar();
      },
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <Text accessibilityRole="header" style={tipografia.subtitulo}>Tienda de premios</Text>
          <View style={estilos.filaMonedas}>
            <Ionicons name="logo-bitcoin" size={18} color={colores.doradoOscuro} accessibilityElementsHidden importantForAccessibility="no" />
            <Text style={estilos.textoMonedas}>{monedas} monedas de la familia</Text>
          </View>

          {mensaje && (
            <View style={[estilos.mensaje, mensaje.error ? estilos.mensajeError : estilos.mensajeOk]} accessibilityRole="alert">
              <Text style={{ ...tipografia.chico, color: mensaje.error ? colores.error : colores.primarioOscuro }}>{mensaje.texto}</Text>
            </View>
          )}

          {editando ? (
            <View>
              <CampoTexto placeholder="Nombre del premio" value={editando.nombre} onChangeText={(nombre) => setEditando({ ...editando, nombre })} maxLength={60} autoFocus />
              <CampoTexto placeholder="Coste en monedas (ej. 30)" value={editando.costo} onChangeText={(costo) => setEditando({ ...editando, costo })} keyboardType="numeric" />
              <BotonPrincipal titulo={editando.id ? 'Guardar cambios' : 'Crear premio'} onPress={guardar} />
              <BotonPrincipal titulo="Cancelar" variante="secundario" onPress={() => setEditando(null)} />
            </View>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 320 }}>
                {premios.length === 0 && (
                  <Text style={[tipografia.cuerpoSuave, { textAlign: 'center', paddingVertical: espaciado.lg }]}>
                    Aún no hay premios. {esAdmin ? 'Crea el primero.' : 'Pídele a quien administra la familia que cree alguno.'}
                  </Text>
                )}
                {premios.map((premio) => {
                  const alcanza = monedas >= premio.costo;
                  return (
                    <View key={premio.id} style={estilos.fila}>
                      <View style={{ flex: 1 }}>
                        <Text style={tipografia.cuerpo}>{premio.nombre}</Text>
                        <Text style={tipografia.chico}>{premio.costo} monedas</Text>
                      </View>
                      {esAdmin && (
                        <>
                          <TouchableOpacity onPress={() => setEditando({ id: premio.id, nombre: premio.nombre, costo: String(premio.costo) })} style={estilos.botonIcono} accessibilityRole="button" accessibilityLabel={`Editar el premio ${premio.nombre}`}>
                            <Ionicons name="create-outline" size={20} color={colores.textoSuave} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => pedirEliminar(premio)} style={estilos.botonIcono} accessibilityRole="button" accessibilityLabel={`Eliminar el premio ${premio.nombre}`}>
                            <Ionicons name="trash-outline" size={20} color={colores.textoSuave} />
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        onPress={() => pedirCanje(premio)}
                        disabled={!alcanza}
                        style={[estilos.botonCanjear, !alcanza && estilos.botonDeshabilitado]}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !alcanza }}
                        accessibilityLabel={alcanza ? `Canjear ${premio.nombre}` : `Canjear ${premio.nombre}: faltan ${premio.costo - monedas} monedas`}
                      >
                        <Text style={estilos.textoCanjear}>Canjear</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {canjes.length > 0 && (
                  <View style={{ marginTop: espaciado.md }}>
                    <Text style={[tipografia.chico, { marginBottom: espaciado.xs }]}>Últimos canjes</Text>
                    {canjes.map((canje) => (
                      <Text key={canje.id} style={tipografia.cuerpoSuave}>
                        {canje.usuario}: {canje.premio} (-{canje.costo})
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={{ marginTop: espaciado.md }}>
                {esAdmin && <BotonPrincipal titulo="Nuevo premio" onPress={() => { setMensaje(null); setEditando({ nombre: '', costo: '' }); }} />}
                <BotonPrincipal titulo="Cerrar" variante="secundario" onPress={onCerrar} />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: espaciado.lg,
    },
    tarjeta: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.lg,
    },
    filaMonedas: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaciado.xs,
      marginTop: espaciado.xs,
      marginBottom: espaciado.sm,
    },
    textoMonedas: {
      ...tipografia.cuerpo,
      color: colores.doradoOscuro,
    },
    mensaje: {
      borderRadius: radios.md,
      padding: espaciado.sm,
      marginBottom: espaciado.sm,
    },
    mensajeError: { backgroundColor: colores.errorSuave },
    mensajeOk: { backgroundColor: colores.primarioSuave },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaciado.xs,
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
    },
    botonIcono: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonCanjear: {
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: colores.primario,
      borderRadius: radios.sm,
      paddingHorizontal: espaciado.md,
    },
    botonDeshabilitado: {
      opacity: 0.4,
    },
    textoCanjear: {
      ...tipografia.chico,
      color: colores.textoSobrePrimario,
    },
  });
}
