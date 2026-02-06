// src/components/FormularioCliente.jsx
import { useState } from 'react'

/**
 * Formulario para crear/editar un cliente
 * @param {Object} props
 * @param {Object} props.clienteInicial - Cliente inicial para edición (opcional)
 * @param {Function} props.onSubmit - Callback al enviar el formulario
 * @param {boolean} props.loading - Si está cargando
 */
export default function FormularioCliente({ clienteInicial, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    nombre: clienteInicial?.nombre || '',
    email: clienteInicial?.email || '',
    telefono: clienteInicial?.telefono || '',
    direccion: clienteInicial?.direccion || '',
  })
  
  const [errores, setErrores] = useState({})
  
  // Funciones de validación
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }
  
  const validarTelefono = (telefono) => {
    const cleanPhone = telefono.replace(/[\s\-()]/g, '')
    return cleanPhone.length === 10 && /^\d+$/.test(cleanPhone) && cleanPhone.startsWith('0')
  }
  
  const validarFormulario = () => {
    const nuevosErrores = {}
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido'
    } else if (formData.nombre.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres'
    }
    
    // Validar email
    if (!formData.email.trim()) {
      nuevosErrores.email = 'El email es requerido'
    } else if (!validarEmail(formData.email)) {
      nuevosErrores.email = 'El email no es válido'
    }
    
    // Validar teléfono (opcional pero si se ingresa debe ser válido)
    if (formData.telefono && !validarTelefono(formData.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener 10 dígitos y empezar con 0'
    }
    
    // Validar dirección
    if (!formData.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es requerida'
    } else if (formData.direccion.trim().length < 5) {
      nuevosErrores.direccion = 'La dirección debe tener al menos 5 caracteres'
    }
    
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validarFormulario()) {
      onSubmit(formData)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="formulario-cliente">
      {/* Campo Nombre */}
      <div className="form-group">
        <label htmlFor="nombre">Nombre *</label>
        <input
          id="nombre"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ingrese el nombre del cliente"
          disabled={loading}
          className={errores.nombre ? 'input-error' : ''}
        />
        {errores.nombre && (
          <span role="alert" className="error-message">
            {errores.nombre}
          </span>
        )}
      </div>
      
      {/* Campo Email */}
      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="ejemplo@correo.com"
          disabled={loading}
          className={errores.email ? 'input-error' : ''}
        />
        {errores.email && (
          <span role="alert" className="error-message">
            {errores.email}
          </span>
        )}
      </div>
      
      {/* Campo Teléfono */}
      <div className="form-group">
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input
          id="telefono"
          type="tel"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          placeholder="0987654321"
          disabled={loading}
          className={errores.telefono ? 'input-error' : ''}
        />
        {errores.telefono && (
          <span role="alert" className="error-message">
            {errores.telefono}
          </span>
        )}
      </div>
      
      {/* Campo Dirección */}
      <div className="form-group">
        <label htmlFor="direccion">Dirección *</label>
        <textarea
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          placeholder="Ingrese la dirección completa"
          disabled={loading}
          rows="3"
          className={errores.direccion ? 'input-error' : ''}
        />
        {errores.direccion && (
          <span role="alert" className="error-message">
            {errores.direccion}
          </span>
        )}
      </div>
      
      {/* Botón Enviar */}
      <button
        type="submit"
        disabled={loading}
        className="btn-submit"
      >
        {loading ? 'Guardando...' : 'Guardar Cliente'}
      </button>
    </form>
  )
}
