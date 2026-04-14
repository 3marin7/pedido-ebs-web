import { useState } from 'react';
import MovimientosInventario from './MovimientosInventario';
import HistorialInventario from './HistorialInventario';
import MejoresProductos from './MejoresProductos';
import './DashboardProducts.css';
export default function GestionInventario() {
  const [vistaActual, setVistaActual] = useState('movimientos');

  return (
    <div className="dashboard-container">
      {/* Navegación con botones azules */}
      <div className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-buttons">
            <button
              onClick={() => setVistaActual('movimientos')}
              className={`nav-button ${
                vistaActual === 'movimientos' ? 'active' : ''
              }`}
            >
              📥 Registrar Movimiento
            </button>
            <button
              onClick={() => setVistaActual('historial')}
              className={`nav-button ${
                vistaActual === 'historial' ? 'active' : ''
              }`}
            >
              📊 Ver Historial
            </button>
            <button
              onClick={() => setVistaActual('mejores')}
              className={`nav-button ${
                vistaActual === 'mejores' ? 'active' : ''
              }`}
            >
              🏆 Mejores Productos
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="dashboard-content">
        <div className="w-full">
          {vistaActual === 'movimientos' && <MovimientosInventario />}
          {vistaActual === 'historial' && <HistorialInventario />}
          {vistaActual === 'mejores' && <MejoresProductos />}
        </div>
      </div>
    </div>
  );
}