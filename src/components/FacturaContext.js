import React, { createContext, useContext, useState } from 'react';

const FacturaContext = createContext();

export const FacturaProvider = ({ children }) => {
  const [itemsFactura, setItemsFactura] = useState([]);
  const [cliente, setCliente] = useState(null);

  const agregarProductoFactura = (producto) => {
    setItemsFactura(prevItems => {
      const itemExistente = prevItems.find(item => item.id === producto.id);
      
      if (itemExistente) {
        return prevItems.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prevItems, { ...producto, cantidad: 1 }];
      }
    });
  };

  const eliminarProductoFactura = (id) => {
    setItemsFactura(prevItems => prevItems.filter(item => item.id !== id));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    
    setItemsFactura(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  return (
    <FacturaContext.Provider
      value={{
        itemsFactura,
        cliente,
        setCliente,
        agregarProductoFactura,
        eliminarProductoFactura,
        actualizarCantidad
      }}
    >
      {children}
    </FacturaContext.Provider>
  );
};

export const useFactura = () => useContext(FacturaContext);