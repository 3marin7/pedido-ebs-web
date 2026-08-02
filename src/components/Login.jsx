// components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';
import './Login.css'; // Asegúrate de importar el CSS

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Datos de usuarios con roles y permisos específicos
  const users = [
    { 
      id: 1, 
      username: 'Edwin', 
      password: 'emc', 
      role: 'admin',
      descripcion: 'Admin - Acceso Total. Administrador del sistema. Ver todo, gestionar usuarios, reportes completos.'
    },
    { 
      id: 2, 
      username: 'fredy', 
      password: '801551', 
      role: 'admin',
      descripcion: 'Admin - Acceso Total. Administrador del sistema. Ver todo, gestionar usuarios, reportes completos.'
    },
    { 
      id: 8,
      username: 'EMC',
      password: 'superadmin123',
      role: 'superadmin',
      descripcion: 'SUPERADMIN - Acceso EXCLUSIVO a reportes avanzados. Reporte de clientes por producto, análisis completo.'
    },
    { 
      id: 3, 
      username: 'sharon', 
      password: 'sharon1310', 
      role: 'inventario',
      descripcion: 'Bodega (Inventario) - Crear facturas, catálogo, gestión de inventario, gestión de pedidos.'
    },
    { 
      id: 4, 
      username: 'caro', 
      password: 'caro123', 
      role: 'contabilidad',
      descripcion: 'Contabilidad - Ver facturas guardadas, reportes de cobros, análisis de contabilidad.'
    },
    { 
      id: 5, 
      username: 'fabian', 
      password: '0411', 
      role: 'admin',
      descripcion: 'Admin - Acceso Total. Administrador del sistema. Ver todo, gestionar usuarios, reportes completos.'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      login(user);
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Distribuciones EBS Hermanos Marín</h1>
          <p>Sistema de pedidos y catálogo digital</p>
        </div>
        
        <div className="login-content">
          <div className="login-form-section">
            <h3>Acceso para el equipo</h3>
            <p>Ingresa tus credenciales para acceder al sistema</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Usuario:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Ingresa tu usuario"
                />
              </div>
              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="login-btn">
                Ingresar al sistema
              </button>
            </form>

            {/* Información de Roles - OCULTA */}
            {/* <div className="roles-info">
              <h4>Roles y Accesos:</h4>
              <div className="roles-list">
                {users.map((user) => (
                  <div key={user.id} className={`role-item role-${user.role}`}>
                    <div className="role-header">
                      <strong>{user.username}</strong>
                      <span className="role-badge">{user.role}</span>
                    </div>
                    <p>{user.descripcion}</p>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
          
          <div className="catalog-section">
            <div className="catalog-icon">
              <i className="fas fa-store">📦</i>
            </div>
            <h2>Explora nuestro catálogo</h2>
            <p>Descubre todos nuestros productos disponibles y realiza tus pedidos directamente por WhatsApp sin necesidad de crear una cuenta.</p>
            <Link to="/catalogo-clientes" className="catalog-btn">
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;