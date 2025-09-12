import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Cerrar menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          toggleRef.current && !toggleRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
        { path: '/dashboard', label: 'Dashboard', icon: '📈' }, // ← AÑADE ESTA LÍNEA
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

  const availableLinks = getAvailableLinks();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Distribuciones EBS</h2>
          <span className="user-role">{user.role}</span>
          
          {/* Botón de menú hamburguesa para móviles */}
          <button 
            ref={toggleRef}
            className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Abrir menú"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
        
        <div 
          ref={menuRef}
          className={`nav-links ${isMenuOpen ? 'nav-links-open' : ''}`}
        >
          {availableLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${isActiveLink(link.path) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.icon && <span className="nav-icon">{link.icon}</span>}
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="nav-user">
          <span className="username">Hola, {user.username}</span>
          <button 
            onClick={handleLogout} 
            className="logout-btn"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Cerrar sesión</span>
          </button>
        </div>
      </div>
      
      {/* Overlay para cerrar el menú al hacer clic fuera */}
      {isMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navigation;