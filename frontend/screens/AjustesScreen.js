import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { URL_BASE } from '../constants/config';
import { TAMANOS_FUENTE } from '../theme';
import BotonPrincipal from '../components/BotonPrincipal';
import CampoTexto from '../components/CampoTexto';
import Tarjeta from '../components/Tarjeta';
import HistorialModal from '../components/HistorialModal';
import { confirmar } from '../utils/confirmar';

const OPCIONES_MODO = [
  { valor: 'sistema', etiqueta: 'Automático' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
];

const AYUDA = [
  {
    icono: 'paw-outline',
    titulo: 'La mascota',
    texto: 'Su salud sube cuando alguien de la familia completa tareas positivas, y baja con las negativas. Cuidadla entre todos.',
  },
  {
    icono: 'logo-bitcoin',
    titulo: 'Monedas',
    texto: 'Se ganan igual que los puntos (suben y bajan con las tareas) y son compartidas por toda la familia. Sirven para desbloquear especies y complementos nuevos para la mascota.',
  },
  {
    icono: 'trophy-outline',
    titulo: 'Ranking',
    texto: 'Se reinicia cada semana para que siempre haya una competición fresca. Las monedas y la mascota no se ven afectadas por el reinicio.',
  },
];

function SelectorSegmentado({ opciones, valorActual, onCambiar, colores, tipografia, espaciado, radios }) {
  const estilos = crearEstilosSelector(colores, tipografia, espaciado, radios);
  return (
    <View style={estilos.fila}>
      {opciones.map((opcion) => {
        const activo = opcion.valor === valorActual;
        return (
          <TouchableOpacity
            key={opcion.valor}
            onPress={() => onCambiar(opcion.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            style={[estilos.segmento, activo && estilos.segmentoActivo]}
          >
            <Text style={activo ? estilos.textoActivo : estilos.texto}>{opcion.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function crearEstilosSelector(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    fila: {
      flexDirection: 'row',
      backgroundColor: colores.superficieSuave,
      borderRadius: radios.md,
      padding: 4,
    },
    segmento: {
      flex: 1,
      paddingVertical: espaciado.sm,
      alignItems: 'center',
      borderRadius: radios.sm,
    },
    segmentoActivo: {
      backgroundColor: colores.primario,
    },
    texto: {
      ...tipografia.chico,
      color: colores.textoSuave,
    },
    textoActivo: {
      ...tipografia.chico,
      color: colores.textoSobrePrimario,
    },
  });
}

export default function AjustesScreen() {
  const { usuario, token, cerrarSesion, actualizarUsuario } = useAuth();
  const { colores, tipografia, espaciado, radios, modoPreferido, tamanoFuente, cambiarModo, cambiarTamanoFuente } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado, radios);
  const [familia, setFamilia] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [modalPasswordVisible, setModalPasswordVisible] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [modalNombreVisible, setModalNombreVisible] = useState(false);
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [passwordEliminar, setPasswordEliminar] = useState('');
  const [errorCarga, setErrorCarga] = useState(null);

  const soyAdmin = miembros.some((m) => m.id === usuario.id && m.rol === 'admin');

  const opcionesTamano = Object.keys(TAMANOS_FUENTE).map((clave) => ({
    valor: clave,
    etiqueta: TAMANOS_FUENTE[clave].etiqueta,
  }));

  async function cargarFamilia() {
    try {
      const cabecera = { headers: { 'Authorization': `Bearer ${token}` } };
      const [respuestaFamilia, respuestaMiembros] = await Promise.all([
        fetch(`${URL_BASE}/familias/${usuario.familia_id}`, cabecera),
        fetch(`${URL_BASE}/familias/${usuario.familia_id}/usuarios`, cabecera),
      ]);
      if (respuestaFamilia.ok) setFamilia(await respuestaFamilia.json());
      if (respuestaMiembros.ok) setMiembros(await respuestaMiembros.json());
      setErrorCarga(null);
    } catch {
      setErrorCarga('No se pudieron cargar los datos de la familia. Comprueba la conexión.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarFamilia();
    }, [usuario.familia_id])
  );

  async function copiarCodigo() {
    await Clipboard.setStringAsync(familia.codigo_invitacion);
    Alert.alert('Copiado', 'El código de invitación se copió al portapapeles');
  }

  async function compartirCodigo() {
    try {
      await Share.share({
        message: `Únete a nuestra familia en FamilyQuest con el código ${familia.codigo_invitacion}`,
      });
    } catch (error) {
      console.log('Error compartiendo el código', error);
    }
  }

  function confirmarSalirDeFamilia() {
    confirmar({
      titulo: '¿Salir de la familia?',
      mensaje: 'Perderás tus puntos actuales y dejarás de ver sus tareas, ranking y chat. Podrás unirte de nuevo con un código de invitación.',
      textoConfirmar: 'Salir',
      alConfirmar: salirDeFamilia,
    });
  }

  async function salirDeFamilia() {
    try {
      const respuesta = await fetch(`${URL_BASE}/usuarios/${usuario.id}/salir-familia`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json();
        Alert.alert('Error', datos.error);
        return;
      }

      await actualizarUsuario({ familia_id: null });
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo salir de la familia');
    }
  }

  // Llamada genérica de administración: avisa con un Alert si el servidor responde con error.
  async function llamarAdmin(ruta, metodo, body) {
    try {
      const respuesta = await fetch(`${URL_BASE}${ruta}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return null;
      }
      return datos;
    } catch {
      Alert.alert('Error de conexión', 'No se pudo conectar con el servidor');
      return null;
    }
  }

  function abrirModalNombre() {
    setNombreFamilia(familia.nombre);
    setModalNombreVisible(true);
  }

  async function guardarNombreFamilia() {
    if (!nombreFamilia.trim()) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para la familia');
      return;
    }
    if (await llamarAdmin(`/familias/${usuario.familia_id}`, 'PUT', { nombre: nombreFamilia.trim() })) {
      setModalNombreVisible(false);
      cargarFamilia();
    }
  }

  function confirmarRegenerarCodigo() {
    confirmar({
      titulo: '¿Generar un código nuevo?',
      mensaje: 'El código actual dejará de funcionar. Quienes ya están en la familia no se ven afectados.',
      textoConfirmar: 'Generar',
      alConfirmar: async () => {
        if (await llamarAdmin(`/familias/${usuario.familia_id}/codigo`, 'POST')) cargarFamilia();
      },
    });
  }

  function confirmarExpulsar(miembro) {
    confirmar({
      titulo: `¿Quitar a ${miembro.nombre}?`,
      mensaje: 'Saldrá de la familia y perderá sus puntos actuales. Podrá volver con un código de invitación.',
      textoConfirmar: 'Quitar',
      alConfirmar: async () => {
        if (await llamarAdmin(`/familias/${usuario.familia_id}/usuarios/${miembro.id}`, 'DELETE')) cargarFamilia();
      },
    });
  }

  async function eliminarCuenta() {
    if (!passwordEliminar) {
      Alert.alert('Falta la contraseña', 'Escribe tu contraseña para confirmar');
      return;
    }
    if (await llamarAdmin(`/usuarios/${usuario.id}`, 'DELETE', { password: passwordEliminar })) {
      setModalEliminarVisible(false);
      await cerrarSesion();
    }
  }

  function abrirModalPassword() {
    setPasswordActual('');
    setPasswordNueva('');
    setPasswordConfirmar('');
    setModalPasswordVisible(true);
  }

  async function cambiarPassword() {
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      Alert.alert('Faltan datos', 'Rellena los tres campos');
      return;
    }
    if (passwordNueva.length < 8) {
      Alert.alert('Contraseña demasiado corta', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      Alert.alert('No coinciden', 'La nueva contraseña y su confirmación no son iguales');
      return;
    }

    setCambiandoPassword(true);
    try {
      const respuesta = await fetch(`${URL_BASE}/usuarios/${usuario.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        Alert.alert('Error', datos.error);
        return;
      }

      setModalPasswordVisible(false);
      Alert.alert('Listo', 'Tu contraseña se ha actualizado');
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo cambiar la contraseña');
    } finally {
      setCambiandoPassword(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text accessibilityRole="header" style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Ajustes</Text>

      {errorCarga && (
        <View style={styles.error} accessibilityRole="alert">
          <Text style={styles.textoError}>{errorCarga}</Text>
          <TouchableOpacity onPress={cargarFamilia} accessibilityRole="button" accessibilityLabel="Reintentar">
            <Text style={styles.enlaceCambiarPassword}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Tarjeta>
        <Text style={tipografia.subtitulo}>{usuario.nombre}</Text>
        <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.xs }]}>{usuario.email}</Text>
        <TouchableOpacity onPress={abrirModalPassword} style={styles.filaCambiarPassword}>
          <Ionicons name="lock-closed-outline" size={16} color={colores.primario} />
          <Text style={styles.enlaceCambiarPassword}>Cambiar contraseña</Text>
        </TouchableOpacity>
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Apariencia</Text>
        <SelectorSegmentado
          opciones={OPCIONES_MODO}
          valorActual={modoPreferido}
          onCambiar={cambiarModo}
          colores={colores}
          tipografia={tipografia}
          espaciado={espaciado}
          radios={radios}
        />
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Tamaño de letra</Text>
        <SelectorSegmentado
          opciones={opcionesTamano}
          valorActual={tamanoFuente}
          onCambiar={cambiarTamanoFuente}
          colores={colores}
          tipografia={tipografia}
          espaciado={espaciado}
          radios={radios}
        />
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Tu familia</Text>

        {familia && (
          <>
            <View style={styles.filaNombreFamilia}>
              <Text style={tipografia.cuerpo}>{familia.nombre}</Text>
              {soyAdmin && (
                <TouchableOpacity
                  onPress={abrirModalNombre}
                  style={styles.botonIcono}
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar el nombre de la familia"
                >
                  <Ionicons name="create-outline" size={20} color={colores.primario} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filaCodigo}>
              <View>
                <Text style={tipografia.cuerpoSuave}>Código de invitación</Text>
                <Text style={styles.codigo}>{familia.codigo_invitacion}</Text>
              </View>
              <View style={styles.filaBotonesCodigo}>
                <TouchableOpacity onPress={copiarCodigo} style={styles.botonIcono} accessibilityRole="button" accessibilityLabel="Copiar el código de invitación">
                  <Ionicons name="copy-outline" size={20} color={colores.primario} />
                </TouchableOpacity>
                <TouchableOpacity onPress={compartirCodigo} style={styles.botonIcono} accessibilityRole="button" accessibilityLabel="Compartir el código de invitación">
                  <Ionicons name="share-social-outline" size={20} color={colores.primario} />
                </TouchableOpacity>
                {soyAdmin && (
                  <TouchableOpacity
                    onPress={confirmarRegenerarCodigo}
                    style={styles.botonIcono}
                    accessibilityRole="button"
                    accessibilityLabel="Generar un código de invitación nuevo"
                  >
                    <Ionicons name="refresh-outline" size={20} color={colores.primario} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}

        <Text style={[tipografia.chico, { marginTop: espaciado.md, marginBottom: espaciado.xs }]}>
          Miembros ({miembros.length})
        </Text>
        {miembros.map((miembro) => (
          <View key={miembro.id} style={styles.filaMiembro}>
            <Text style={[tipografia.cuerpo, { flex: 1 }]}>
              {miembro.nombre}
              {miembro.id === usuario.id ? ' (tú)' : ''}
              {miembro.rol === 'admin' ? ' · admin' : ''}
            </Text>
            <Text style={styles.puntosMiembro}>{miembro.puntos_totales} pts</Text>
            {soyAdmin && miembro.id !== usuario.id && (
              <TouchableOpacity
                onPress={() => confirmarExpulsar(miembro)}
                style={styles.botonIcono}
                accessibilityRole="button"
                accessibilityLabel={`Quitar a ${miembro.nombre} de la familia`}
              >
                <Ionicons name="person-remove-outline" size={20} color={colores.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          onPress={() => setHistorialVisible(true)}
          style={styles.filaCambiarPassword}
          accessibilityRole="button"
          accessibilityLabel="Ver el historial de actividad"
        >
          <Ionicons name="time-outline" size={16} color={colores.primario} />
          <Text style={styles.enlaceCambiarPassword}>Historial de actividad</Text>
        </TouchableOpacity>
      </Tarjeta>

      <Tarjeta>
        <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Cómo funciona</Text>
        {AYUDA.map((item, indice) => (
          <View key={item.titulo} style={[styles.filaAyuda, indice === AYUDA.length - 1 && { borderBottomWidth: 0 }]}>
            <Ionicons name={item.icono} size={22} color={colores.primario} style={styles.iconoAyuda} />
            <View style={{ flex: 1 }}>
              <Text style={tipografia.cuerpo}>{item.titulo}</Text>
              <Text style={[tipografia.chico, { marginTop: 2 }]}>{item.texto}</Text>
            </View>
          </View>
        ))}
      </Tarjeta>

      <BotonPrincipal titulo="Salir de la familia" variante="secundario" onPress={confirmarSalirDeFamilia} />
      <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
      <TouchableOpacity
        onPress={() => { setPasswordEliminar(''); setModalEliminarVisible(true); }}
        style={styles.enlaceEliminar}
        accessibilityRole="button"
        accessibilityLabel="Eliminar mi cuenta"
      >
        <Text style={styles.textoEliminar}>Eliminar mi cuenta</Text>
      </TouchableOpacity>

      <HistorialModal visible={historialVisible} onCerrar={() => setHistorialVisible(false)} />

      <Modal visible={modalNombreVisible} transparent animationType="fade" onRequestClose={() => setModalNombreVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.tarjetaModal}>
            <Text accessibilityRole="header" style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Nombre de la familia</Text>
            <CampoTexto placeholder="Nombre de la familia" value={nombreFamilia} onChangeText={setNombreFamilia} maxLength={60} autoFocus />
            <BotonPrincipal titulo="Guardar" onPress={guardarNombreFamilia} />
            <BotonPrincipal titulo="Cancelar" variante="secundario" onPress={() => setModalNombreVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={modalEliminarVisible} transparent animationType="fade" onRequestClose={() => setModalEliminarVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.tarjetaModal}>
            <Text accessibilityRole="header" style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Eliminar mi cuenta</Text>
            <Text style={[tipografia.chico, { marginBottom: espaciado.md }]}>
              Se borrarán tu cuenta, tus mensajes, tus notificaciones y tus puntos. Si eres la última persona de la familia, también se borrará la familia. No se puede deshacer.
            </Text>
            <CampoTexto placeholder="Tu contraseña" value={passwordEliminar} onChangeText={setPasswordEliminar} secureTextEntry />
            <BotonPrincipal titulo="Eliminar para siempre" onPress={eliminarCuenta} />
            <BotonPrincipal titulo="Cancelar" variante="secundario" onPress={() => setModalEliminarVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={modalPasswordVisible} transparent animationType="fade" onRequestClose={() => setModalPasswordVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.tarjetaModal}>
            <Text style={[tipografia.subtitulo, { marginBottom: espaciado.sm }]}>Cambiar contraseña</Text>
            <CampoTexto
              placeholder="Contraseña actual"
              value={passwordActual}
              onChangeText={setPasswordActual}
              secureTextEntry
            />
            <CampoTexto
              placeholder="Nueva contraseña"
              value={passwordNueva}
              onChangeText={setPasswordNueva}
              secureTextEntry
            />
            <CampoTexto
              placeholder="Confirmar nueva contraseña"
              value={passwordConfirmar}
              onChangeText={setPasswordConfirmar}
              secureTextEntry
            />
            <BotonPrincipal
              titulo={cambiandoPassword ? 'Guardando...' : 'Guardar'}
              onPress={cambiarPassword}
              disabled={cambiandoPassword}
            />
            <BotonPrincipal titulo="Cancelar" variante="secundario" onPress={() => setModalPasswordVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function crearEstilos(colores, tipografia, espaciado, radios) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    filaCambiarPassword: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: espaciado.sm,
      minHeight: 44,
    },
    enlaceCambiarPassword: {
      ...tipografia.chico,
      color: colores.primario,
    },
    fondoModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: espaciado.lg,
    },
    tarjetaModal: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colores.superficie,
      borderRadius: radios.lg,
      padding: espaciado.lg,
    },
    filaCodigo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: espaciado.sm,
      paddingTop: espaciado.sm,
      borderTopWidth: 1,
      borderTopColor: colores.borde,
    },
    filaBotonesCodigo: {
      flexDirection: 'row',
      gap: espaciado.sm,
    },
    botonIcono: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      padding: espaciado.xs,
      backgroundColor: colores.primarioSuave,
      borderRadius: radios.sm,
    },
    codigo: {
      ...tipografia.subtitulo,
      color: colores.primarioOscuro,
      letterSpacing: 1,
    },
    filaMiembro: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espaciado.sm,
      paddingVertical: espaciado.xs,
    },
    filaNombreFamilia: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    enlaceEliminar: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      marginBottom: espaciado.lg,
    },
    textoEliminar: {
      ...tipografia.chico,
      color: colores.error,
      textDecorationLine: 'underline',
    },
    error: {
      backgroundColor: colores.errorSuave,
      borderRadius: radios.md,
      padding: espaciado.sm,
      marginBottom: espaciado.md,
    },
    textoError: {
      ...tipografia.chico,
      color: colores.error,
    },
    puntosMiembro: {
      ...tipografia.cuerpo,
      color: colores.textoSuave,
    },
    filaAyuda: {
      flexDirection: 'row',
      paddingVertical: espaciado.sm,
      borderBottomWidth: 1,
      borderBottomColor: colores.borde,
      gap: espaciado.sm,
    },
    iconoAyuda: {
      marginTop: 2,
    },
  });
}
