import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};

// Componente para proteger rutas según el rol
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simular verificación de sesión al cargar la app
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
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

  const value = {
    user,
    login,
    logout
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      <Router>
        {user && <Navigation />}
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <Login />
          } />
          
          {/* Rutas protegidas */}
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
            <ProtectedRoute requiredRole="admin">
              <FacturasGuardadas />
            </ProtectedRoute>
          } />
          
          <Route path="/factura/:id" element={
            <ProtectedRoute requiredRole="admin">
              <FacturaDetalle />
            </ProtectedRoute>
          } />
          
          <Route path="/reportes-cobros" element={
            <ProtectedRoute requiredRole="admin">
              <ReportesCobros />
            </ProtectedRoute>
          } />
          
          <Route path="/catalogo" element={
            <ProtectedRoute requiredRole="admin">
              <CatalogoProductos mode="admin" />
            </ProtectedRoute>
          } />
          
          {/* Ruta pública para catálogo de clientes */}
          <Route path="/catalogo-clientes" element={<CatalogoClientes />} />
          
          <Route path="/gestion-pedidos" element={
            <ProtectedRoute requiredRole="admin">
              <GestionPedidos />
            </ProtectedRoute>
          } />
          
          {/* Rutas para vendedor */}
          <Route path="/clientes" element={
            <ProtectedRoute requiredRole="vendedor">
              <ClientesScreen />
            </ProtectedRoute>
          } />
          
          <Route path="/gestion-pedidos-vendedor" element={
            <ProtectedRoute requiredRole="vendedor">
              <GestionPedidos mode="vendedor" />
            </ProtectedRoute>
          } />
          
          {/* Ruta para cliente */}
          <Route path="/catalogo-cliente" element={
            <ProtectedRoute requiredRole="cliente">
              <CatalogoProductos mode="cliente" />
            </ProtectedRoute>
          } />
          
          {/* Rutas adicionales */}
          <Route path="/unauthorized" element={<div>No tienes permisos para acceder a esta página</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;