import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Creación del contexto de autenticación
export const AuthContext = createContext();

// Proveedor de autenticación que envuelve la aplicación
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Función para verificar la sesión en localStorage
  const checkSession = useCallback(() => {
    try {
      const storedAuth = localStorage.getItem('auth');
      if (!storedAuth) return false;
      
      const parsedAuth = JSON.parse(storedAuth);
      return !!(parsedAuth.loggedIn && parsedAuth.user);
    } catch (error) {
      console.error("Error checking session:", error);
      return false;
    }
  }, []);

  // Efecto para verificar autenticación al montar el componente
  useEffect(() => {
    const verifyAuth = () => {
      const isValid = checkSession();
      if (isValid) {
        const { user } = JSON.parse(localStorage.getItem('auth'));
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    verifyAuth();
  }, [checkSession]);

  // Función para iniciar sesión
  const login = (userData) => {
    const newAuth = {
      user: userData,
      loggedIn: true
    };
    localStorage.setItem('auth', JSON.stringify(newAuth));
    setAuthState({
      user: userData,
      isAuthenticated: true,
      isLoading: false
    });
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('auth');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  return (
    <AuthContext.Provider value={{
      user: authState.user,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      login,
      logout,
      checkSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};