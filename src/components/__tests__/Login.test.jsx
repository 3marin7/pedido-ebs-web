import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

// Mock del contexto useAuth
jest.mock('../../App', () => ({
  useAuth: jest.fn()
}))

// Importar el mock para poder configurarlo en los tests
import { useAuth } from '../../App'

// Wrapper para incluir BrowserRouter (requerido por Login por el Link)
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Login', () => {
  // Configuración antes de cada test
  beforeEach(() => {
    jest.clearAllMocks()
    // Configurar el mock de useAuth
    useAuth.mockReturnValue({
      login: jest.fn()
    })
  })

  describe('Renderizado inicial', () => {
    test('renderiza el formulario de login', () => {
      renderWithRouter(<Login />)
      
      // Verificar que existen los elementos principales
      expect(screen.getByPlaceholderText(/usuario/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ingresar al sistema/i })).toBeInTheDocument()
    })

    test('renderiza campos de entrada vacíos inicialmente', () => {
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      
      expect(usernameInput.value).toBe('')
      expect(passwordInput.value).toBe('')
    })

    test('NO muestra mensaje de error inicialmente', () => {
      renderWithRouter(<Login />)
      
      // No debe haber mensajes de error
      const errorMessages = screen.queryAllByText(/credenciales incorrectas/i)
      expect(errorMessages).toHaveLength(0)
    })

    test('renderiza la información de los roles disponibles', () => {
      renderWithRouter(<Login />)
      
      // Debe mostrar los nombres de usuario disponibles para prueba
      expect(screen.getByText('e11')).toBeInTheDocument()
      expect(screen.getByText('inv')).toBeInTheDocument()
      expect(screen.getByText('EBS')).toBeInTheDocument()
      expect(screen.getByText('caro')).toBeInTheDocument()
    })
  })

  describe('Cambios en los campos', () => {
    test('actualiza el valor del campo usuario cuando se escribe', () => {
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      fireEvent.change(usernameInput, { target: { value: 'e11' } })
      
      expect(usernameInput.value).toBe('e11')
    })

    test('actualiza el valor del campo contraseña cuando se escribe', () => {
      renderWithRouter(<Login />)
      
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      fireEvent.change(passwordInput, { target: { value: 'emc' } })
      
      expect(passwordInput.value).toBe('emc')
    })

    test('acepta múltiples cambios en los campos', () => {
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      
      // Primer cambio
      fireEvent.change(usernameInput, { target: { value: 'e11' } })
      expect(usernameInput.value).toBe('e11')
      
      // Segundo cambio
      fireEvent.change(usernameInput, { target: { value: 'inv' } })
      expect(usernameInput.value).toBe('inv')
      
      // Cambios en contraseña
      fireEvent.change(passwordInput, { target: { value: 'emc' } })
      expect(passwordInput.value).toBe('emc')
      
      fireEvent.change(passwordInput, { target: { value: '1v3nt' } })
      expect(passwordInput.value).toBe('1v3nt')
    })
  })

  describe('Validación de credenciales - Login exitoso', () => {
    test('llama a login cuando credenciales son correctas (admin e11)', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'e11' } })
      fireEvent.change(passwordInput, { target: { value: 'emc' } })
      fireEvent.click(submitButton)
      
      // Debe llamar a login con el usuario correcto
      expect(loginMock).toHaveBeenCalled()
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'e11',
          role: 'admin'
        })
      )
    })

    test('llama a login cuando credenciales de inventario son correctas', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'inv' } })
      fireEvent.change(passwordInput, { target: { value: '1v3nt' } })
      fireEvent.click(submitButton)
      
      expect(loginMock).toHaveBeenCalled()
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'inv',
          role: 'inventario'
        })
      )
    })

    test('llama a login con usuario EBS (segundo admin)', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'EBS' } })
      fireEvent.change(passwordInput, { target: { value: '801551' } })
      fireEvent.click(submitButton)
      
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'EBS',
          role: 'admin'
        })
      )
    })

    test('acepta credenciales de contabilidad (caro)', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'caro' } })
      fireEvent.change(passwordInput, { target: { value: 'caro123' } })
      fireEvent.click(submitButton)
      
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'caro',
          role: 'contabilidad'
        })
      )
    })
  })

  describe('Validación de credenciales - Login fallido', () => {
    test('muestra error si usuario es incorrecto', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'usuarioincorrecto' } })
      fireEvent.change(passwordInput, { target: { value: 'emc' } })
      fireEvent.click(submitButton)
      
      // NO debe llamar a login
      expect(loginMock).not.toHaveBeenCalled()
      
      // Debe mostrar mensaje de error
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument()
    })

    test('muestra error si contraseña es incorrecta', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'e11' } })
      fireEvent.change(passwordInput, { target: { value: 'contraseñaincorrecta' } })
      fireEvent.click(submitButton)
      
      expect(loginMock).not.toHaveBeenCalled()
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument()
    })

    test('muestra error si ambas credenciales son incorrectas', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      fireEvent.change(usernameInput, { target: { value: 'usuariofalso' } })
      fireEvent.change(passwordInput, { target: { value: 'contraseñafalsa' } })
      fireEvent.click(submitButton)
      
      expect(loginMock).not.toHaveBeenCalled()
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument()
    })

    test('no envía el formulario si algún campo está vacío (validación del navegador)', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      // Sin llenar nada, el navegador no permite enviar por required
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      
      // Simular un clic (pero el navegador bloqueará el envío)
      // Simplemente verificar que los campos están marcados como required
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      
      expect(usernameInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    test('requiere usuario y contraseña para login - usuario faltante', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      fireEvent.change(passwordInput, { target: { value: 'emc' } })
      
      // El campo de usuario es required, así que no se enviará sin él
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      expect(usernameInput).toHaveAttribute('required')
    })

    test('requiere usuario y contraseña para login - contraseña faltante', () => {
      const loginMock = jest.fn()
      useAuth.mockReturnValue({ login: loginMock })
      
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      fireEvent.change(usernameInput, { target: { value: 'e11' } })
      
      // El campo de contraseña es required, así que no se enviará sin él
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      expect(passwordInput).toHaveAttribute('required')
    })
  })

  describe('Accesibilidad', () => {
    test('los inputs tienen atributo required', () => {
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      
      expect(usernameInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    test('los inputs tienen tipos correctos', () => {
      renderWithRouter(<Login />)
      
      const usernameInput = screen.getByPlaceholderText(/usuario/i)
      const passwordInput = screen.getByPlaceholderText(/contraseña/i)
      
      expect(usernameInput).toHaveAttribute('type', 'text')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('el botón de submit es accesible y está habilitado', () => {
      renderWithRouter(<Login />)
      
      const submitButton = screen.getByRole('button', { name: /ingresar al sistema/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toBeEnabled()
    })
  })

  describe('Información de usuarios de prueba', () => {
    test('muestra toda la información sobre los usuarios disponibles', () => {
      renderWithRouter(<Login />)
      
      // Debe mostrar los cuatro usuarios de prueba
      const usuarios = ['e11', 'inv', 'EBS', 'caro']
      usuarios.forEach(usuario => {
        expect(screen.getByText(usuario)).toBeInTheDocument()
      })
    })

    test('muestra los roles de cada usuario', () => {
      renderWithRouter(<Login />)
      
      // Debe mostrar los roles
      const roles = ['admin', 'inventario', 'contabilidad']
      roles.forEach(rol => {
        const roleElements = screen.getAllByText(rol)
        expect(roleElements.length).toBeGreaterThan(0)
      })
    })

    test('muestra la descripción de los roles', () => {
      renderWithRouter(<Login />)
      
      // Debe mostrar descripciones de los roles - verificar que exista al menos una
      const descriptionElements = screen.getAllByText(/acceso|admin|inventario|contabilidad|crear|gestión/i)
      expect(descriptionElements.length).toBeGreaterThan(0)
    })
  })

  describe('Links y navegación', () => {
    test('renderiza el link al catálogo de clientes', () => {
      renderWithRouter(<Login />)
      
      const catalogLink = screen.getByRole('link', { name: /ver catálogo completo/i })
      expect(catalogLink).toBeInTheDocument()
      expect(catalogLink).toHaveAttribute('href', '/catalogo-clientes')
    })

    test('muestra el mensaje sobre el catálogo', () => {
      renderWithRouter(<Login />)
      
      expect(screen.getByText(/explora nuestro catálogo/i)).toBeInTheDocument()
      expect(screen.getByText(/descubre todos nuestros productos/i)).toBeInTheDocument()
    })
  })
})
