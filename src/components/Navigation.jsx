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
    navigate('/');
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
    if (!user) {
      // Enlaces para usuarios NO logueados (público)
      return [
        { path: '/', label: 'Inicio', icon: '🏠', tipo: 'simple' },
        { path: '/catalogo-clientes', label: 'Catálogo', icon: '📚', tipo: 'simple' }
      ];
    }

    // Enlaces para usuarios logueados (según rol)
    if (user.role === 'admin') {
      return [
        // VENTAS E INICIO - Grupo
        { 
          path: '#ventas', 
          label: 'Inicio & Ventas', 
          icon: '🏠', 
          tipo: 'grupo',
          submenu: [
            { path: '/dashboard-ventas', label: 'Dashboard Ventas', icon: '📊' },
            { path: '/facturacion', label: 'Facturación', icon: '🧾' },
            { path: '/nueva-factura', label: 'Nueva Factura', icon: '➕' },
            { path: '/facturas', label: 'Facturas Guardadas', icon: '📄' }
          ]
        },
        // CONTABILIDAD - Grupo (ACTUALIZADO)
        { 
          path: '#contabilidad', 
          label: 'Contabilidad', 
          icon: '💰', 
          tipo: 'grupo',
          submenu: [
            { path: '/contabilidad', label: 'Dashboard Contabilidad', icon: '📊' },
            { path: '/gastos', label: 'Gestión de Gastos', icon: '💸' },
            { path: '/reportes-cobros', label: 'Reportes Cobros', icon: '📈' },
            { path: '/rutas-cobro', label: 'Rutas de Cobro', icon: '🚗' }
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
            { path: '/mapa-locales', label: 'Mapa de Locales', icon: '🗺️' }
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
        { path: '/facturacion', label: 'Facturación', icon: '🧾', tipo: 'simple' },
        { path: '/nueva-factura', label: 'Nueva Factura', icon: '➕', tipo: 'simple' },
        { path: '/facturas', label: 'Facturas', icon: '📄', tipo: 'simple' },
        { path: '/catalogo', label: 'Productos', icon: '📦', tipo: 'simple' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒', tipo: 'simple' },
        { path: '/clientes', label: 'Clientes', icon: '👥', tipo: 'simple' },
        // Agregar acceso a gastos para vendedores si es necesario
        { path: '/gastos', label: 'Gastos', icon: '💸', tipo: 'simple' }
      ];
    }

    if (user.role === 'inventario') {
      return [
        { path: '/catalogo', label: 'Productos', icon: '📦', tipo: 'simple' },
        { path: '/gestion-inventario', label: 'Inventario', icon: '📋', tipo: 'simple' },
        { path: '/gestion-pedidos', label: 'Pedidos', icon: '🛒', tipo: 'simple' }
      ];
    }

    if (user.role === 'cliente') {
      return [
        { path: '/catalogo-cliente', label: 'Catálogo', icon: '📚', tipo: 'simple' }
      ];
    }

    // Enlaces por defecto para otros roles
    return [
      { path: '/facturacion', label: 'Facturación', icon: '🧾', tipo: 'simple' },
      { path: '/gastos', label: 'Gastos', icon: '💸', tipo: 'simple' }
    ];
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
          <Link to="/">
            <h2>Distribuciones EBS</h2>
          </Link>
          {user && <span className="user-role">{user.role}</span>}
          
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
          {user ? (
            <>
              <span className="username">Hola, {user.username}</span>
              <button 
                onClick={handleLogout} 
                className="logout-btn"
              >
                <span className="logout-icon">🚪</span>
                <span className="logout-text">Cerrar sesión</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="login-link">
              <span className="login-icon">🔐</span>
              <span className="login-text">Acceso Equipo</span>
            </Link>
          )}
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