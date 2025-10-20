import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
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
import DashboardVentas from './components/DashboardVentas';
import MallMap from './components/MallMap';
import RutasCobro from './components/RutasCobro'; // NUEVO COMPONENTE

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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
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

// Componente para manejar los metatags específicos de cada página
const PageMeta = ({ title, description }) => {
  return (
    <Helmet>
      <title>{title || 'Catálogo EBS Hermanos Marín'}</title>
      <meta name="description" content={description || 'Sistema de gestión y catálogo de productos EBS Hermanos Marín'} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      <meta name="theme-color" content="#4CAF50" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="EBS Catálogo" />
      
      {/* Open Graph tags para compartir */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title || 'Catálogo EBS Hermanos Marín'} />
      <meta property="og:description" content={description || 'Sistema de gestión y catálogo de productos'} />
      
      {/* Prevenir indexación en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <meta name="robots" content="noindex, nofollow" />
      )}
    </Helmet>
  );
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
    <HelmetProvider>
      <AuthContext.Provider value={value}>
        <Router>
          {/* Metatags globales */}
          <PageMeta />
          
          {user && <Navigation />}
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={
              <>
                <PageMeta title="Iniciar Sesión - EBS" description="Inicia sesión en el sistema EBS Hermanos Marín" />
                {user ? <Navigate to="/" replace /> : <Login />}
              </>
            } />
            
            {/* Ruta principal según rol */}
            <Route path="/" element={
              <ProtectedRoute>
                <>
                  <PageMeta 
                    title={user?.role === 'cliente' ? "Catálogo Cliente - EBS" : "Facturación - EBS"} 
                    description={user?.role === 'cliente' ? "Explora nuestro catálogo de productos" : "Sistema de facturación EBS"} 
                  />
                  {user?.role === 'cliente' ? 
                    <CatalogoProductos mode="cliente" /> : 
                    <InvoiceScreen />
                  }
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas para administrador */}
            <Route path="/facturas" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <>
                  <PageMeta title="Facturas Guardadas - EBS" description="Gestión de facturas del sistema EBS" />
                  <FacturasGuardadas />
                </>
              </ProtectedRoute>
            } />
            
            {/* NUEVA RUTA: Rutas de Cobro Inteligentes */}
            <Route path="/rutas-cobro" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <>
                  <PageMeta 
                    title="Rutas de Cobro Inteligentes - EBS" 
                    description="Sistema de priorización para visitas de cobranza optimizadas" 
                  />
                  <RutasCobro />
                </>
              </ProtectedRoute>
            } />
            
            {/* Nueva ruta para Dashboard de Ventas */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <>
                  <PageMeta title="Dashboard de Ventas - EBS" description="Panel de control y análisis de ventas" />
                  <DashboardVentas />
                </>
              </ProtectedRoute>
            } />
            
            {/* Ruta para el Mapa de Locales */}
            <Route path="/mapa-locales" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <>
                  <PageMeta title="Mapa de Locales - EBS" description="Mapa interactivo de locales y ubicaciones" />
                  <MallMap />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/factura/:id" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <>
                  <PageMeta title="Detalle de Factura - EBS" description="Detalle completo de la factura" />
                  <FacturaDetalle />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/reportes-cobros" element={
              <ProtectedRoute requiredRoles={['admin']}>
                <>
                  <PageMeta title="Reportes de Cobros - EBS" description="Reportes y análisis de cobros" />
                  <ReportesCobros />
                </>
              </ProtectedRoute>
            } />
            
            <Route path="/catalogo" element={
              <ProtectedRoute requiredRoles={['admin', 'inventario']}>
                <>
                  <PageMeta title="Catálogo de Productos - EBS" description="Gestión del catálogo de productos" />
                  <CatalogoProductos mode="admin" />
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas para gestión de inventario */}
            <Route path="/gestion-inventario" element={
              <ProtectedRoute requiredRoles={['admin', 'inventario']}>
                <>
                  <PageMeta title="Gestión de Inventario - EBS" description="Control y gestión del inventario" />
                  <GestionInventario />
                </>
              </ProtectedRoute>
            } />
            
            {/* Ruta pública para catálogo de clientes */}
            <Route path="/catalogo-clientes" element={
              <>
                <PageMeta 
                  title="Catálogo Digital - EBS Hermanos Marín" 
                  description="Catálogo digital de productos EBS Hermanos Marín. Ing. Edwin Marín 3004583117"
                />
                <CatalogoClientes />
              </>
            } />
            
            {/* Rutas para gestión de pedidos */}
            <Route path="/gestion-pedidos" element={
              <ProtectedRoute requiredRoles={['admin', 'inventario', 'vendedor']}>
                <>
                  <PageMeta title="Gestión de Pedidos - EBS" description="Seguimiento y gestión de pedidos" />
                  <GestionPedidos mode="vendedor" />
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas para vendedor */}
            <Route path="/clientes" element={
              <ProtectedRoute requiredRoles={['admin', 'vendedor', 'inventario']}>
                <>
                  <PageMeta title="Gestión de Clientes - EBS" description="Administración de clientes del sistema" />
                  <ClientesScreen />
                </>
              </ProtectedRoute>
            } />
            
            {/* Ruta para cliente */}
            <Route path="/catalogo-cliente" element={
              <ProtectedRoute requiredRoles={['cliente']}>
                <>
                  <PageMeta title="Catálogo - EBS" description="Catálogo exclusivo para clientes" />
                  <CatalogoProductos mode="cliente" />
                </>
              </ProtectedRoute>
            } />
            
            {/* Rutas adicionales */}
            <Route path="/unauthorized" element={
              <>
                <PageMeta title="Acceso No Autorizado - EBS" description="No tienes permisos para acceder a esta página" />
                <div className="flex justify-center items-center h-screen">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Acceso no autorizado</h1>
                    <p className="text-gray-600">No tienes permisos para acceder a esta página</p>
                  </div>
                </div>
              </>
            } />
            
            <Route path="*" element={
              <>
                <PageMeta title="Página No Encontrada - EBS" description="La página que buscas no existe" />
                <NotFound />
              </>
            } />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </HelmetProvider>
  );
}

export default App;