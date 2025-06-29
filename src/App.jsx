import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InvoiceScreen from './components/InvoiceScreen';
import FacturasGuardadas from './components/FacturasGuardadas';
import FacturaDetalle from './components/FacturaDetalle';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvoiceScreen />} />
        <Route path="/facturas" element={<FacturasGuardadas />} />
        <Route path="/factura/:id" element={<FacturaDetalle />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
