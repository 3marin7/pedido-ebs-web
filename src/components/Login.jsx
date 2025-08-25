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

  // Datos de usuarios de ejemplo
  const users = [
    { id: 1, username: 'EBS', password: 'E1', role: 'admin' },
    { id: 2, username: 'v', password: 'v1', role: 'vendedor' },
    { id: 3, username: 'c', password: 'c', role: 'cliente' }
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
          </div>
          
          <div className="catalog-section">
            <div className="catalog-icon">
              <i className="fas fa-store"></i>
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