import React from 'react';
import './FacturaPreview.css';

const FacturaPreview = ({ factura, onVolver, onGuardar }) => {
  return (
    <div className="factura-container">
      <h1>VISTA PREVIA DE LA FACTURA</h1>
      
      <div className="datos-factura">
        <p><b>Cliente:</b> {factura.cliente || "No especificado"}</p>
        <p><b>Fecha:</b> {factura.fecha || "No especificada"}</p>
        <p><b>Vendedor:</b> {factura.vendedor || "No especificado"}</p>
      </div>

      <table className="tabla-productos">
        <thead>
          <tr>
            <th>Cantidad</th>
            <th>Producto</th>
            <th>Precio Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {factura.productos?.map((p) => (
            <tr key={p.id}>
              <td>{p.cantidad || 0}</td>
              <td>{p.nombre || "Sin nombre"}</td>
              <td>${(p.precio || 0).toFixed(2)}</td>
              <td>${((p.cantidad || 0) * (p.precio || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total">
        <h3>TOTAL: ${factura.total?.toFixed(2) || "0.00"}</h3>
      </div>

      <div className="botones">
        <button onClick={onVolver} className="boton-volver">VOLVER</button>
        <button onClick={onGuardar} className="boton-guardar">GUARDAR FACTURA</button>
      </div>
    </div>
  );
};

export default FacturaPreview;