// components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css'; // Asegúrate de importar el CSS

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result?.error) {
        setError('No se pudo iniciar sesión. Verifica tus credenciales o consulta al administrador.');
      }
    } catch (loginError) {
      console.error('Error al iniciar sesión:', loginError);
      setError('No se pudo conectar con el servicio de autenticación. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/actualizar-contrasena`,
      });

      if (recoveryError) throw recoveryError;
      setMessage('Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la contraseña.');
    } catch (recoveryError) {
      console.error('Error solicitando recuperación de contraseña:', recoveryError);
      setError('No se pudo solicitar el restablecimiento. Verifica el correo o inténtalo más tarde.');
    } finally {
      setIsSubmitting(false);
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
            <p>{isRecoveryMode ? 'Te enviaremos un enlace para crear una contraseña nueva.' : 'Ingresa tus credenciales para acceder al sistema'}</p>
            
            <form onSubmit={isRecoveryMode ? handlePasswordRecovery : handleSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Correo electrónico:</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Ingresa tu correo electrónico"
                  disabled={isSubmitting}
                />
              </div>
              {!isRecoveryMode && (
                <div className="form-group">
                  <label htmlFor="login-password">Contraseña:</label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    disabled={isSubmitting}
                  />
                </div>
              )}
              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message" role="status">{message}</div>}
              <button type="submit" className="login-btn" disabled={isSubmitting}>
                {isSubmitting
                  ? (isRecoveryMode ? 'Enviando...' : 'Verificando...')
                  : (isRecoveryMode ? 'Enviar enlace' : 'Ingresar al sistema')}
              </button>
            </form>
            <button
              type="button"
              className="login-text-btn"
              onClick={() => {
                setIsRecoveryMode(!isRecoveryMode);
                setError('');
                setMessage('');
              }}
              disabled={isSubmitting}
            >
              {isRecoveryMode ? 'Volver al inicio de sesión' : 'Olvidé mi contraseña'}
            </button>
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