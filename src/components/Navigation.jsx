import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuActivo, setMenuActivo] = useState(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSubmenu = (menu) => {
    setMenuActivo(menuActivo === menu ? null : menu);
  };

  // Cerrar menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          toggleRef.current && !toggleRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setMenuActivo(null);
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
    const commonLinks = [];

    if (user.role === 'admin') {
      return [
        // VENTAS E INICIO - Grupo
        { 
          path: '#ventas', 
          label: 'Inicio & Ventas', 
          icon: '🏠', 
          tipo: 'grupo',
          submenu: [
            { path: '/', label: 'Inicio Principal', icon: '🏠' },
            { path: '/facturas', label: 'Facturas', icon: '📄' },
            { path: '/dashboard', label: 'Dashboard Ventas', icon: '📊' }
          ]
        },
        // CONTABILIDAD - Grupo
        { 
          path: '#contabilidad', 
          label: 'Contabilidad', 
          icon: '💰', 
          tipo: 'grupo',
          submenu: [
            { path: '/contabilidad', label: 'Estado Cartera', icon: '📋' },
            { path: '/gastos', label: 'Gestión Gastos', icon: '📊' },
            { path: '/reportes-cobros', label: 'Reportes', icon: '📈' }
          ]
        },
        // CLIENTES - Grupo
        { 
          path: '#clientes', 
          label: 'Clientes', 
          icon: '👥', 
          tipo: 'grupo',
          submenu: [
            { path: '/clientes', label: 'Gestión Clientes', icon: '👤' },
            { path: '/mapa-locales', label: 'Mapa de Locales', icon: '🗺️' },
            { path: '/rutas-cobro', label: 'Rutas Cobro', icon: '🚗' }
          ]
        },
        // BODEGA - Grupo
        { 
          path: '#bodega', 
          label: 'Bodega', 
          icon: '📦', 
          tipo: 'grupo',
          submenu: [
            { path: '/catalogo', label: 'Catálogo Productos', icon: '📚' },
            { path: '/gestion-inventario', label: 'Gestión Inventario', icon: '📋' },
            { path: '/gestion-pedidos', label: 'Gestión Pedidos', icon: '🛒' }
          ]
        }
      ];
    }

    if (user.role === 'vendedor') {
      return [
        { path: '/', label: 'Inicio', icon: '🏠', tipo: 'simple' },
        { path: '/facturas', label: 'Facturas', icon: '📄', tipo: 'simple' },
        { path: '/catalogo', label: 'Productos', icon: '📦', tipo: 'simple' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒', tipo: 'simple' },
        { path: '/clientes', label: 'Clientes', icon: '👥', tipo: 'simple' }
      ];
    }

    if (user.role === 'inventario') {
      return [
        { path: '/', label: 'Inicio', icon: '🏠', tipo: 'simple' },
        { path: '/catalogo', label: 'Productos', icon: '📦', tipo: 'simple' },
        { path: '/gestion-inventario', label: 'Inventario', icon: '📋', tipo: 'simple' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒', tipo: 'simple' },
        { path: '/clientes', label: 'Clientes', icon: '👥', tipo: 'simple' }
      ];
    }

    if (user.role === 'cliente') {
      return [
        { path: '/', label: 'Inicio', icon: '🏠', tipo: 'simple' },
        { path: '/catalogo-cliente', label: 'Catálogo', icon: '📚', tipo: 'simple' }
      ];
    }

    return [{ path: '/', label: 'Inicio', icon: '🏠', tipo: 'simple' }];
  };

  // Verificar si la ruta está activa
  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path.startsWith('#')) {
      // Para grupos, verificar si alguna ruta del submenu está activa
      const grupo = availableLinks.find(link => link.path === path);
      if (grupo && grupo.submenu) {
        return grupo.submenu.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
      }
      return false;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderLink = (link) => {
    if (link.tipo === 'grupo') {
      return (
        <div key={link.path} className="nav-group">
          <button 
            className={`nav-link group-toggle ${isActiveLink(link.path) ? 'active' : ''}`}
            onClick={() => toggleSubmenu(link.path)}
          >
            {link.icon && <span className="nav-icon">{link.icon}</span>}
            <span className="nav-label">{link.label}</span>
            <span className={`dropdown-arrow ${menuActivo === link.path ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          <div className={`submenu ${menuActivo === link.path ? 'submenu-open' : ''}`}>
            {link.submenu.map(subLink => (
              <Link 
                key={subLink.path} 
                to={subLink.path} 
                className={`submenu-link ${isActiveLink(subLink.path) ? 'active' : ''}`}
                onClick={() => {
                  setIsMenuOpen(false);
                  setMenuActivo(null);
                }}
              >
                {subLink.icon && <span className="nav-icon">{subLink.icon}</span>}
                <span className="nav-label">{subLink.label}</span>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return (
      <Link 
        key={link.path} 
        to={link.path} 
        className={`nav-link ${isActiveLink(link.path) ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      >
        {link.icon && <span className="nav-icon">{link.icon}</span>}
        <span className="nav-label">{link.label}</span>
      </Link>
    );
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
          {availableLinks.map(renderLink)}
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
          onClick={() => {
            setIsMenuOpen(false);
            setMenuActivo(null);
          }}
        ></div>
      )}
    </nav>
  );
};

export default Navigation;