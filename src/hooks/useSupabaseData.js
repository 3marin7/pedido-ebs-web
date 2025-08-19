// src/hooks/useSupabaseData.js
import { useState, useEffect } from 'react'
import { supabaseApi } from '../lib/supabase'

// Hook para Clientes
export const useClientes = () => {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarClientes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await supabaseApi.obtenerClientes()
      setClientes(data)
    } catch (err) {
      setError(err.message)
      console.error('Error cargando clientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const agregarCliente = async (nuevoCliente) => {
    try {
      const cliente = await supabaseApi.crearCliente(nuevoCliente)
      setClientes(prev => [...prev, cliente])
      return cliente
    } catch (err) {
      console.error('Error agregando cliente:', err)
      throw err
    }
  }

  const actualizarCliente = async (id, clienteActualizado) => {
    try {
      const cliente = await supabaseApi.actualizarCliente(id, clienteActualizado)
      setClientes(prev => prev.map(c => c.id === id ? cliente : c))
      return cliente
    } catch (err) {
      console.error('Error actualizando cliente:', err)
      throw err
    }
  }

  return {
    clientes,
    loading,
    error,
    agregarCliente,
    actualizarCliente,
    recargar: cargarClientes
  }
}

// Hook para Productos
export const useProductos = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarProductos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await supabaseApi.obtenerProductos()
      setProductos(data)
    } catch (err) {
      setError(err.message)
      console.error('Error cargando productos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const agregarProducto = async (nuevoProducto) => {
    try {
      const producto = await supabaseApi.crearProducto(nuevoProducto)
      setProductos(prev => [...prev, producto])
      return producto
    } catch (err) {
      console.error('Error agregando producto:', err)
      throw err
    }
  }

  return {
    productos,
    loading,
    error,
    agregarProducto,
    recargar: cargarProductos
  }
}

// Hook para Facturas
export const useFacturas = () => {
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarFacturas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await supabaseApi.obtenerFacturas()
      setFacturas(data)
    } catch (err) {
      setError(err.message)
      console.error('Error cargando facturas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarFacturas()
  }, [])

  const crearFactura = async (nuevaFactura, detalles) => {
    try {
      // 1. Crear la factura
      const factura = await supabaseApi.crearFactura(nuevaFactura)
      
      // 2. Crear los detalles
      if (detalles && detalles.length > 0) {
        const detallesConFacturaId = detalles.map(detalle => ({
          ...detalle,
          factura_id: factura.id
        }))
        await supabaseApi.crearDetallesFactura(detallesConFacturaId)
      }
      
      // 3. Recargar facturas
      await cargarFacturas()
      
      return factura
    } catch (err) {
      console.error('Error creando factura:', err)
      throw err
    }
  }

  return {
    facturas,
    loading,
    error,
    crearFactura,
    recargar: cargarFacturas
  }
}

// Hook para Categorías
export const useCategorias = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoading(true)
        const data = await supabaseApi.obtenerCategorias()
        setCategorias(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    cargarCategorias()
  }, [])

  return { categorias, loading, error }
}

// Hook para Vendedores
export const useVendedores = () => {
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargarVendedores = async () => {
      try {
        setLoading(true)
        const data = await supabaseApi.obtenerVendedores()
        setVendedores(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    cargarVendedores()
  }, [])

  return { vendedores, loading, error }
}