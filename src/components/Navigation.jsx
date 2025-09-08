// components/Navigation.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {user?.role === 'admin' && (
            <>
              <Link to="/" style={{ marginRight: '10px' }}>Facturación</Link>
              <Link to="/facturas" style={{ marginRight: '10px' }}>Facturas Guardadas</Link>
              <Link to="/gestion-inventario" style={{ marginRight: '10px' }}>📦 Inventario</Link> {/* NUEVO ENLACE */}
              <Link to="/reportes-cobros" style={{ marginRight: '10px' }}>Reportes</Link>
              <Link to="/catalogo" style={{ marginRight: '10px' }}>Productos</Link>
              <Link to="/catalogo-clientes" style={{ marginRight: '10px' }}>Clientes</Link>
              <Link to="/gestion-pedidos" style={{ marginRight: '10px' }}>Pedidos</Link>
            </>
          )}
          {user?.role === 'vendedor' && (
            <>
              <Link to="/" style={{ marginRight: '10px' }}>Facturación</Link>
              <Link to="/clientes" style={{ marginRight: '10px' }}>Clientes</Link>
              <Link to="/gestion-pedidos-vendedor" style={{ marginRight: '10px' }}>Pedidos</Link>
            </>
          )}
          {user?.role === 'cliente' && (
            <Link to="/catalogo-cliente">Catálogo</Link>
          )}
        </div>
        <div>
          <span style={{ marginRight: '10px' }}>Hola, {user?.username}</span>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;