import { createContext, useContext, useState } from 'react';

const FacturaContext = createContext();

export const FacturaProvider = ({ children }) => {
  const [productosFactura, setProductosFactura] = useState([]);

  const agregarProductoFactura = (producto) => {
    setProductosFactura(prev => {
      const existente = prev.find(p => p.id === producto.id);
      if (existente) {
        return prev.map(p => 
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const eliminarProductoFactura = (id) => {
    setProductosFactura(prev => prev.filter(p => p.id !== id));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    setProductosFactura(prev => 
      prev.map(p => 
        p.id === id ? { ...p, cantidad: nuevaCantidad } : p
      )
    );
  };

  const limpiarFactura = () => {
    setProductosFactura([]);
  };

  return (
    <FacturaContext.Provider 
      value={{ 
        productosFactura, 
        agregarProductoFactura,
        eliminarProductoFactura,
        actualizarCantidad,
        limpiarFactura
      }}
    >
      {children}
    </FacturaContext.Provider>
  );
};

export const useFactura = () => useContext(FacturaContext);