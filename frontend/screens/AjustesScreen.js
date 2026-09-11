import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { TAMANOS_FUENTE } from '../theme';
import BotonPrincipal from '../components/BotonPrincipal';
import Tarjeta from '../components/Tarjeta';

const OPCIONES_MODO = [
  { valor: 'sistema', etiqueta: 'Automático' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
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
  const { usuario, cerrarSesion } = useAuth();
  const { colores, tipografia, espaciado, radios, modoPreferido, tamanoFuente, cambiarModo, cambiarTamanoFuente } = useTema();
  const styles = crearEstilos(colores, tipografia, espaciado);

  const opcionesTamano = Object.keys(TAMANOS_FUENTE).map((clave) => ({
    valor: clave,
    etiqueta: TAMANOS_FUENTE[clave].etiqueta,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: espaciado.md, paddingTop: 60 }}>
      <Text style={[tipografia.tituloGrande, { marginBottom: espaciado.md }]}>Ajustes</Text>

      <Tarjeta>
        <Text style={tipografia.subtitulo}>{usuario.nombre}</Text>
        <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.xs }]}>{usuario.email}</Text>
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

      <BotonPrincipal titulo="Cerrar sesión" variante="secundario" onPress={cerrarSesion} />
    </ScrollView>
  );
}

function crearEstilos(colores, tipografia, espaciado) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
  });
}
