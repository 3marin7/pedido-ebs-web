import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

const ActualizarContrasena = () => {
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        console.error('No se pudo validar el enlace de recuperación:', sessionError);
      }
      setHasRecoverySession(Boolean(data?.session));
      setIsCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setHasRecoverySession(true);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setPassword('');
      setConfirmPassword('');
      setMessage('Tu contraseña fue actualizada. Ya puedes continuar usando el sistema.');
    } catch (updateError) {
      console.error('Error actualizando la contraseña:', updateError);
      setError('No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo otra vez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Actualizar contraseña</h1>
          <p>Distribuciones EBS Hermanos Marín</p>
        </div>
        <div className="login-form-section">
          {isCheckingSession ? (
            <p role="status">Validando el enlace...</p>
          ) : !hasRecoverySession ? (
            <>
              <p>El enlace no es válido o ya venció. Solicita uno nuevo desde el inicio de sesión.</p>
              <Link className="catalog-btn" to="/login">Volver al inicio de sesión</Link>
            </>
          ) : message ? (
            <>
              <div className="success-message" role="status">{message}</div>
              <Link className="catalog-btn" to="/facturacion">Continuar</Link>
            </>
          ) : (
            <>
              <h3>Define una contraseña nueva</h3>
              <p>Usa al menos 12 caracteres y no reutilices la contraseña anterior.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="new-password">Nueva contraseña:</label>
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirmar contraseña:</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    required
                  />
                </div>
                {error && <div className="error-message" role="alert">{error}</div>}
                <button className="login-btn" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Actualizando...' : 'Guardar contraseña nueva'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActualizarContrasena;
