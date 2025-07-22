import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InvoiceScreen from './components/InvoiceScreen';
import FacturasGuardadas from './components/FacturasGuardadas';
import FacturaDetalle from './components/FacturaDetalle';
import ReportesCobros from './components/ReportesCobros';
import CatalogoProductos from './components/CatalogoProductos';
import CatalogoClientes from './components/CatalogoClientes';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InvoiceScreen />} />
        <Route path="/facturas" element={<FacturasGuardadas />} />
        <Route path="/factura/:id" element={<FacturaDetalle />} />
        <Route path="/reportes-cobros" element={<ReportesCobros />} />
        <Route path="/catalogo" element={<CatalogoProductos />} />
        <Route path="/catalogo-clientes" element={<CatalogoClientes />} />
      </Routes>
    </Router>
  );
}

export default App;