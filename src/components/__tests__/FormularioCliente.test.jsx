// src/components/__tests__/FormularioCliente.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormularioCliente from '../FormularioCliente'

describe('FormularioCliente', () => {
  
  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  describe('Renderizado inicial', () => {
    test('renderiza todos los campos del formulario', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /guardar cliente/i })).toBeInTheDocument()
    })
    
    test('renderiza campos vacíos inicialmente', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      expect(inputNombre.value).toBe('')
    })
    
    test('llena los campos con datos iniciales', () => {
      const clienteInicial = {
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '0987654321',
        direccion: 'Calle Principal 123'
      }
      
      const handleSubmit = jest.fn()
      render(<FormularioCliente clienteInicial={clienteInicial} onSubmit={handleSubmit} />)
      
      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('juan@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0987654321')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Calle Principal 123')).toBeInTheDocument()
    })
  })
  
  // ============================================
  // TESTS DE VALIDACIÓN - NOMBRE
  // ============================================
  describe('Validación de Nombre', () => {
    test('muestra error si nombre está vacío', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const button = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(button)
      
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      expect(handleSubmit).not.toHaveBeenCalled()
    })
    
    test('muestra error si nombre tiene menos de 3 caracteres', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      fireEvent.change(inputNombre, { target: { value: 'AB' } })
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(screen.getByText(/al menos 3 caracteres/i)).toBeInTheDocument()
    })
    
    test('acepta nombre válido', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan Pérez' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
  
  // ============================================
  // TESTS DE VALIDACIÓN - EMAIL
  // ============================================
  describe('Validación de Email', () => {
    test('muestra error si email está vacío', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(screen.getByText('El email es requerido')).toBeInTheDocument()
    })
    
    test('muestra error si email no es válido', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'noesunmail' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      // Enviar el formulario
      const boton = screen.getByRole('button', { name: /guardar/i })
      fireEvent.click(boton)
      
      // El formulario NO debe ser enviado porque hay validación fallida
      expect(handleSubmit).not.toHaveBeenCalled()
    })
    
    test('acepta emails válidos', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
  
  // ============================================
  // TESTS DE VALIDACIÓN - TELÉFONO
  // ============================================
  describe('Validación de Teléfono', () => {
    test('teléfono es opcional', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      // No llenar teléfono
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(handleSubmit).toHaveBeenCalled()
    })
    
    test('muestra error si teléfono no tiene 10 dígitos', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputTelefono = screen.getByLabelText(/teléfono/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputTelefono, { target: { value: '0987' } }) // Muy corto
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(screen.getByText(/debe tener 10 dígitos/i)).toBeInTheDocument()
    })
    
    test('muestra error si teléfono no empieza con 0', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputTelefono = screen.getByLabelText(/teléfono/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputTelefono, { target: { value: '1987654321' } }) // Empieza con 1
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(screen.getByText(/empezar con 0/i)).toBeInTheDocument()
    })
    
    test('acepta teléfono con formato', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputTelefono = screen.getByLabelText(/teléfono/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputTelefono, { target: { value: '098-765-4321' } }) // Con guiones
      fireEvent.change(inputDireccion, { target: { value: 'Calle 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
  
  // ============================================
  // TESTS DE VALIDACIÓN - DIRECCIÓN
  // ============================================
  describe('Validación de Dirección', () => {
    test('muestra error si dirección está vacía', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(screen.getByText('La dirección es requerida')).toBeInTheDocument()
    })
    
    test('muestra error si dirección tiene menos de 5 caracteres', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputDireccion, { target: { value: 'Cal' } }) // Muy corta
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(screen.getByText(/al menos 5 caracteres/i)).toBeInTheDocument()
    })
    
    test('acepta dirección válida', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle Principal 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
  
  // ============================================
  // TESTS DE INTERACCIÓN
  // ============================================
  describe('Interacción del formulario', () => {
    test('llama onSubmit con datos correctos', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputTelefono = screen.getByLabelText(/teléfono/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      
      fireEvent.change(inputNombre, { target: { value: 'Juan Pérez' } })
      fireEvent.change(inputEmail, { target: { value: 'juan@example.com' } })
      fireEvent.change(inputTelefono, { target: { value: '0987654321' } })
      fireEvent.change(inputDireccion, { target: { value: 'Calle Principal 123' } })
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      expect(handleSubmit).toHaveBeenCalledWith({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        telefono: '0987654321',
        direccion: 'Calle Principal 123'
      })
    })
    
    test('limpia errores mientras se escribe', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      // Intentar enviar con datos vacíos
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      
      // Escribir nombre
      const inputNombre = screen.getByLabelText(/nombre/i)
      fireEvent.change(inputNombre, { target: { value: 'Juan' } })
      
      // El error debe desaparecer
      expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument()
    })
    
    test('deshabilita campos mientras se carga', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} loading={true} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      const inputEmail = screen.getByLabelText(/email/i)
      const inputDireccion = screen.getByLabelText(/dirección/i)
      const button = screen.getByRole('button')
      
      expect(inputNombre).toBeDisabled()
      expect(inputEmail).toBeDisabled()
      expect(inputDireccion).toBeDisabled()
      expect(button).toBeDisabled()
    })
    
    test('muestra texto "Guardando..." en botón mientras carga', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} loading={true} />)
      
      expect(screen.getByRole('button', { name: /guardando/i })).toBeInTheDocument()
    })
  })
  
  // ============================================
  // TESTS DE CAMBIOS EN CAMPOS
  // ============================================
  describe('Cambios en campos', () => {
    test('actualiza el valor de cada campo', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      fireEvent.change(inputNombre, { target: { value: 'Carlos' } })
      expect(inputNombre.value).toBe('Carlos')
      
      const inputEmail = screen.getByLabelText(/email/i)
      fireEvent.change(inputEmail, { target: { value: 'carlos@example.com' } })
      expect(inputEmail.value).toBe('carlos@example.com')
      
      const inputDireccion = screen.getByLabelText(/dirección/i)
      fireEvent.change(inputDireccion, { target: { value: 'Nueva Calle' } })
      expect(inputDireccion.value).toBe('Nueva Calle')
    })
    
    test('acepta múltiples cambios en un campo', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const inputNombre = screen.getByLabelText(/nombre/i)
      
      fireEvent.change(inputNombre, { target: { value: 'A' } })
      expect(inputNombre.value).toBe('A')
      
      fireEvent.change(inputNombre, { target: { value: 'An' } })
      expect(inputNombre.value).toBe('An')
      
      fireEvent.change(inputNombre, { target: { value: 'Ana' } })
      expect(inputNombre.value).toBe('Ana')
    })
  })
  
  // ============================================
  // TESTS DE ACCESIBILIDAD
  // ============================================
  describe('Accesibilidad', () => {
    test('tiene labels para todos los inputs', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument()
    })
    
    test('muestra mensajes de error con role="alert"', async () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
      
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThan(0)
    })
    
    test('el botón es accesible como botón', () => {
      const handleSubmit = jest.fn()
      render(<FormularioCliente onSubmit={handleSubmit} />)
      
      const button = screen.getByRole('button', { name: /guardar/i })
      expect(button).toBeInTheDocument()
      expect(button.type).toBe('submit')
    })
  })
})
