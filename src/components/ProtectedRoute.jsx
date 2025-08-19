import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkSession } = useAuth();
  const location = useLocation();

  // Verificación de sesión al montar el componente y cuando cambia la ruta
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const isSessionValid = checkSession();
      if (!isSessionValid) {
        console.log('Sesión expirada o inválida');
        // El logout debería manejarse dentro de checkSession
      }
    }
  }, [location.pathname, isAuthenticated, isLoading, checkSession]);

  // Estado de carga
  if (isLoading) {
    return <div className="loading-auth">Cargando...</div>;
  }

  // Redirección si no está autenticado
  if (!isAuthenticated) {
    console.log(`Redirigiendo a login desde: ${location.pathname}`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Renderizar contenido protegido
  return children;
};

export default ProtectedRoute;