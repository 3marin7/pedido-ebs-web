import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import InvoiceScreen from './components/InvoiceScreen';
import FacturasGuardadas from './components/FacturasGuardadas';
import FacturaDetalle from './components/FacturaDetalle';
import ReportesCobros from './components/ReportesCobros';
import CatalogoProductos from './components/CatalogoProductos';
import CatalogoClientes from './components/CatalogoClientes';
import ClientesScreen from './components/ClientesScreen';
import GestionPedidos from './components/GestionPedidos';
import Login from './components/Login';
import NotFound from './components/NotFound';
import Navigation from './components/Navigation';
import GestionInventario from './components/GestionInventario';
import DashboardVentas from './components/DashboardVentas'; // Nueva importación

// Contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};

// Componente para proteger rutas según el rol
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isLoading, checkSession } = useAuth();
  const location = useLocation();

  // Verificación de sesión al montar el componente
  useEffect(() => {
    if (!isLoading && user) {
      const isSessionValid = checkSession();
      if (!isSessionValid) {
        console.log('Sesión expirada o inválida');
      }
    }
  }, [location.pathname, user, isLoading, checkSession]);

  // Estado de carga
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  // Redirección si no está autenticado
  if (!user) {
    console.log(`Redirigiendo a login desde: ${location.pathname}`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si se especifican
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderizar contenido protegido
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificación de sesión al cargar la app
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Función de login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Función para verificar la sesión
  const checkSession = () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      logout();
      return false;
    }
    return true;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    checkSession,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      <Router>
        {user && <Navigation />}
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <Login />
          } />
          
          {/* Ruta principal según rol */}
          <Route path="/" element={
            <ProtectedRoute>
              {user?.role === 'cliente' ? 
                <CatalogoProductos mode="cliente" /> : 
                <InvoiceScreen />
              }
            </ProtectedRoute>
          } />
          
          {/* Rutas para administrador */}
          <Route path="/facturas" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <FacturasGuardadas />
            </ProtectedRoute>
          } />
          
          {/* Nueva ruta para Dashboard de Ventas */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <DashboardVentas />
            </ProtectedRoute>
          } />
          
          <Route path="/factura/:id" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <FacturaDetalle />
            </ProtectedRoute>
          } />
          
          <Route path="/reportes-cobros" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <ReportesCobros />
            </ProtectedRoute>
          } />
          
          <Route path="/catalogo" element={
            <ProtectedRoute requiredRoles={['admin', 'inventario']}>
              <CatalogoProductos mode="admin" />
            </ProtectedRoute>
          } />
          
          {/* Rutas para gestión de inventario */}
          <Route path="/gestion-inventario" element={
            <ProtectedRoute requiredRoles={['admin', 'inventario']}>
              <GestionInventario />
            </ProtectedRoute>
          } />
          
          {/* Ruta pública para catálogo de clientes */}
          <Route path="/catalogo-clientes" element={<CatalogoClientes />} />
          
          {/* Rutas para gestión de pedidos */}
          <Route path="/gestion-pedidos" element={
            <ProtectedRoute requiredRoles={['admin', 'inventario', 'vendedor']}>
              <GestionPedidos mode="vendedor" />
            </ProtectedRoute>
          } />
          
          {/* Rutas para vendedor */}
          <Route path="/clientes" element={
            <ProtectedRoute requiredRoles={['admin', 'vendedor', 'inventario']}>
              <ClientesScreen />
            </ProtectedRoute>
          } />
          
          {/* Ruta para cliente */}
          <Route path="/catalogo-cliente" element={
            <ProtectedRoute requiredRoles={['cliente']}>
              <CatalogoProductos mode="cliente" />
            </ProtectedRoute>
          } />
          
          {/* Rutas adicionales */}
          <Route path="/unauthorized" element={
            <div className="flex justify-center items-center h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600">Acceso no autorizado</h1>
                <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
              </div>
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;