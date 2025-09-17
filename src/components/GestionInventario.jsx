import { useState } from 'react';
import MovimientosInventario from './MovimientosInventario';
import HistorialInventario from './HistorialInventario';
import MejoresProductos from './MejoresProductos';
import './DashboardProducts.css';
export default function GestionInventario() {
  const [vistaActual, setVistaActual] = useState('movimientos');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navegación con botones azules */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setVistaActual('movimientos')}
              className={`py-3 px-6 rounded-t-md font-medium text-sm transition-colors ${
                vistaActual === 'movimientos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              📥 Registrar Movimiento
            </button>
            <button
              onClick={() => setVistaActual('historial')}
              className={`py-3 px-6 rounded-t-md font-medium text-sm transition-colors ${
                vistaActual === 'historial'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              📊 Ver Historial
            </button>
            <button
              onClick={() => setVistaActual('mejores')}
              className={`py-3 px-6 rounded-t-md font-medium text-sm transition-colors ${
                vistaActual === 'mejores'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              🏆 Mejores Productos
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {vistaActual === 'movimientos' && <MovimientosInventario />}
        {vistaActual === 'historial' && <HistorialInventario />}
        {vistaActual === 'mejores' && <MejoresProductos />}
      </div>
    </div>
  );
}