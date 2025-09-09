import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determinar qué enlaces mostrar según el rol
  const getAvailableLinks = () => {
    const commonLinks = [
      { path: '/', label: 'Inicio', icon: '🏠' }
    ];

    if (user.role === 'admin') {
      return [
        ...commonLinks,
        { path: '/facturas', label: 'Facturas', icon: '📄' },
        { path: '/reportes-cobros', label: 'Reportes', icon: '📊' },
        { path: '/catalogo', label: 'Productos', icon: '📦' },
        { path: '/gestion-inventario', label: 'Inventario', icon: '📋' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒' },
        { path: '/clientes', label: 'Clientes', icon: '👥' }
      ];
    }

    if (user.role === 'vendedor') {
      return [
        ...commonLinks,
        { path: '/catalogo', label: 'Productos', icon: '📦' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒' },
        { path: '/clientes', label: 'Clientes', icon: '👥' }
      ];
    }

    if (user.role === 'inventario') {
      return [
        ...commonLinks,
        { path: '/catalogo', label: 'Productos', icon: '📦' },
        { path: '/gestion-inventario', label: 'Inventario', icon: '📋' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒' },
        { path: '/clientes', label: 'Clientes', icon: '👥' }
      ];
    }

    if (user.role === 'cliente') {
      return [
        ...commonLinks,
        { path: '/catalogo-cliente', label: 'Catálogo', icon: '📚' }
      ];
    }

    return commonLinks;
  };

  // Verificar si la ruta está activa
  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Distribuciones EBS</h2>
          <span className="user-role">{user.role}</span>
        </div>
        
        <div className="nav-links">
          {getAvailableLinks().map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${isActiveLink(link.path) ? 'active' : ''}`}
            >
              {link.icon && <span style={{marginRight: '0.5rem'}}>{link.icon}</span>}
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="nav-user">
          <span className="username">Hola, {user.username}</span>
          <button 
            onClick={handleLogout} 
            className="logout-btn"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;