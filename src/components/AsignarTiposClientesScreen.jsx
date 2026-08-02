import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './AsignarTiposClientesScreen.css';

export default function AsignarTiposClientesScreen() {
  const [clientes, setClientes] = useState([]);
  const [tiposClientes, setTiposClientes] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar clientes con sus tipos actuales
      const { data: clientesData, error: errClientes } = await supabase
        .from('clientes_con_limites')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (errClientes) throw errClientes;

      // Cargar tipos de clientes
      const { data: tiposData, error: errTipos } = await supabase
        .from('tipos_clientes')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (errTipos) throw errTipos;

      setClientes(clientesData || []);
      setTiposClientes(tiposData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Actualizar tipo de cliente
  const asignarTipo = async (clienteId, tipoClienteId) => {
    try {
      setGuardando(true);
      setError(null);

      const { error: err } = await supabase
        .from('clientes')
        .update({ tipo_cliente_id: tipoClienteId })
        .eq('id', clienteId);

      if (err) throw err;

      // Actualizar lista local
      setClientes(clientes.map(c =>
        c.id === clienteId ? { ...c, tipo_cliente_id: tipoClienteId } : c
      ));

      setExito('Tipo de cliente asignado ✓');
      setTimeout(() => setExito(null), 2000);
    } catch (error) {
      console.error('Error asignando tipo:', error);
      setError('Error al asignar tipo: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Obtener nombre del tipo
  const obtenerNombreTipo = (tipoId) => {
    const tipo = tiposClientes.find(t => t.id === tipoId);
    return tipo?.nombre || '—';
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    c.identificacion?.includes(filtro)
  );

  if (cargando) {
    return <div className="asignar-tipos-screen loading">Cargando...</div>;
  }

  return (
    <div className="asignar-tipos-screen">
      <div className="header">
        <h1>👥 Asignar Tipos de Clientes</h1>
        <p>Configura el tipo de cliente para aplicar límites de facturación</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <div className="controles">
        <input
          type="text"
          placeholder="Buscar cliente por nombre o identificación..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="search-input"
        />
        <span className="contador">
          {clientesFiltrados.length} de {clientes.length} clientes
        </span>
      </div>

      <div className="tabla-contenedor">
        <table className="tabla-clientes">
          <thead>
            <tr>
              <th>Nombre del Cliente</th>
              <th>Identificación</th>
              <th>Contacto</th>
              <th>Tipo Actual</th>
              <th>Asignar Tipo</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map(cliente => (
                <tr key={cliente.id} className={cliente.tipo_cliente_id ? 'con-tipo' : 'sin-tipo'}>
                  <td className="nombre">
                    <span className="circulo">{cliente.nombre.charAt(0).toUpperCase()}</span>
                    <span>{cliente.nombre}</span>
                  </td>
                  <td>{cliente.identificacion || '—'}</td>
                  <td className="contacto">{cliente.telefono || cliente.correo || '—'}</td>
                  <td>
                    <span className={`badge ${cliente.tipo_cliente_id ? 'badge-asignado' : 'badge-sin-asignar'}`}>
                      {obtenerNombreTipo(cliente.tipo_cliente_id)}
                    </span>
                  </td>
                  <td>
                    <select
                      className="tipo-select"
                      value={cliente.tipo_cliente_id || ''}
                      onChange={(e) => asignarTipo(cliente.id, e.target.value ? parseInt(e.target.value) : null)}
                      disabled={guardando}
                    >
                      <option value="">— Seleccionar —</option>
                      {tiposClientes.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="vacio">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="info-box">
        <h3>💡 Información de Tipos de Clientes</h3>
        <div className="tipos-info">
          {tiposClientes.map(tipo => (
            <div key={tipo.id} className="tipo-info">
              <strong>{tipo.nombre}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
