import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colores, tipografia, espaciado, radios } from '../../theme';
import { ESPECIES } from './especies';

// especiesDesbloqueadas: string[]; costos: { [especie]: { costo } } (de GET /especies-mascota)
export default function SelectorMascota({
  visible,
  onClose,
  especieActiva,
  especiesDesbloqueadas,
  costos,
  monedas,
  onSeleccionar,
  onDesbloquear,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <Text style={tipografia.subtitulo}>Elige la mascota de tu familia</Text>
          <Text style={[tipografia.cuerpoSuave, { marginTop: espaciado.xs, marginBottom: espaciado.md }]}>
            🪙 {monedas} monedas familiares
          </Text>

          <ScrollView style={{ maxHeight: 380 }}>
            {Object.keys(ESPECIES).map((clave) => {
              const info = ESPECIES[clave];
              const desbloqueada = especiesDesbloqueadas.includes(clave);
              const activa = especieActiva === clave;
              const costo = costos?.[clave]?.costo ?? 0;
              const alcanza = monedas >= costo;

              return (
                <View key={clave} style={[estilos.fila, activa && estilos.filaActiva]}>
                  <Text style={estilos.emoji}>{info.emoji}</Text>
                  <Text style={[tipografia.cuerpo, { flex: 1 }]}>{info.nombre}</Text>

                  {desbloqueada ? (
                    <TouchableOpacity
                      onPress={() => onSeleccionar(clave)}
                      disabled={activa}
                      style={[estilos.boton, activa ? estilos.botonActivo : estilos.botonSecundario]}
                    >
                      <Text style={activa ? estilos.textoBotonActivo : estilos.textoBotonSecundario}>
                        {activa ? 'En uso' : 'Elegir'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => alcanza && onDesbloquear(clave)}
                      disabled={!alcanza}
                      style={[estilos.boton, alcanza ? estilos.botonSecundario : estilos.botonDeshabilitado]}
                    >
                      <Text style={alcanza ? estilos.textoBotonSecundario : estilos.textoBotonDeshabilitado}>
                        🔒 {costo}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={estilos.cerrar}>
            <Text style={{ color: colores.primario }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colores.superficie,
    borderRadius: radios.lg,
    padding: espaciado.lg,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    gap: espaciado.sm,
  },
  filaActiva: {
    backgroundColor: colores.primarioSuave,
    borderRadius: radios.sm,
  },
  emoji: {
    fontSize: 26,
  },
  boton: {
    paddingVertical: espaciado.xs,
    paddingHorizontal: espaciado.sm,
    borderRadius: radios.sm,
  },
  botonActivo: {
    backgroundColor: colores.primario,
  },
  botonSecundario: {
    borderWidth: 1.5,
    borderColor: colores.primario,
  },
  botonDeshabilitado: {
    borderWidth: 1.5,
    borderColor: colores.borde,
  },
  textoBotonActivo: {
    color: colores.textoSobrePrimario,
  },
  textoBotonSecundario: {
    color: colores.primario,
  },
  textoBotonDeshabilitado: {
    color: colores.textoSuave,
  },
  cerrar: {
    marginTop: espaciado.md,
    alignItems: 'center',
  },
});
