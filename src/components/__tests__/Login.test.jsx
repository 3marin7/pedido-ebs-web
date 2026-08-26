import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

jest.mock('../../App', () => ({
  useAuth: jest.fn()
}))

import { useAuth } from '../../App'

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>)

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAuth.mockReturnValue({
      login: jest.fn()
    })
  })

  test('renderiza el formulario de login y el acceso al catálogo', () => {
    renderWithRouter(<Login />)

    expect(screen.getByPlaceholderText(/usuario/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar al sistema/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver catálogo completo/i })).toHaveAttribute('href', '/catalogo-clientes')
  })

  test('muestra el formulario vacío al iniciar', () => {
    renderWithRouter(<Login />)

    expect(screen.getByPlaceholderText(/usuario/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/contraseña/i)).toHaveValue('')
    expect(screen.queryByText(/credenciales incorrectas/i)).not.toBeInTheDocument()
  })

  test('actualiza los campos del formulario al escribir', () => {
    renderWithRouter(<Login />)

    const usernameInput = screen.getByPlaceholderText(/usuario/i)
    const passwordInput = screen.getByPlaceholderText(/contraseña/i)

    fireEvent.change(usernameInput, { target: { value: 'Edwin' } })
    fireEvent.change(passwordInput, { target: { value: 'emc' } })

    expect(usernameInput).toHaveValue('Edwin')
    expect(passwordInput).toHaveValue('emc')
  })

  test('llama a login con credenciales válidas de Edwin', () => {
    const loginMock = jest.fn()
    useAuth.mockReturnValue({ login: loginMock })

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByPlaceholderText(/usuario/i), { target: { value: 'Edwin' } })
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: 'emc' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }))

    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'Edwin',
        password: 'emc',
        role: 'admin'
      })
    )
  })

  test('acepta las credenciales válidas de EMC', () => {
    const loginMock = jest.fn()
    useAuth.mockReturnValue({ login: loginMock })

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByPlaceholderText(/usuario/i), { target: { value: 'EMC' } })
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: 'superadmin123' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }))

    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'EMC',
        password: 'superadmin123',
        role: 'superadmin'
      })
    )
  })

  test('acepta las credenciales válidas de Sharon', () => {
    const loginMock = jest.fn()
    useAuth.mockReturnValue({ login: loginMock })

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByPlaceholderText(/usuario/i), { target: { value: 'sharon' } })
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: 'sharon1310' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }))

    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'sharon',
        password: 'sharon1310',
        role: 'inventario'
      })
    )
  })

  test('muestra un error si las credenciales no coinciden', () => {
    const loginMock = jest.fn()
    useAuth.mockReturnValue({ login: loginMock })

    renderWithRouter(<Login />)

    fireEvent.change(screen.getByPlaceholderText(/usuario/i), { target: { value: 'usuario' } })
    fireEvent.change(screen.getByPlaceholderText(/contraseña/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }))

    expect(loginMock).not.toHaveBeenCalled()
    expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument()
  })

  test('mantiene la validación del navegador en los campos', () => {
    renderWithRouter(<Login />)

    expect(screen.getByPlaceholderText(/usuario/i)).toHaveAttribute('required')
    expect(screen.getByPlaceholderText(/contraseña/i)).toHaveAttribute('required')
    expect(screen.getByPlaceholderText(/usuario/i)).toHaveAttribute('type', 'text')
    expect(screen.getByPlaceholderText(/contraseña/i)).toHaveAttribute('type', 'password')
  })

  test('muestra la información del catálogo para usuarios sin cuenta', () => {
    renderWithRouter(<Login />)

    expect(screen.getByText(/explora nuestro catálogo/i)).toBeInTheDocument()
    expect(screen.getByText(/descubre todos nuestros productos/i)).toBeInTheDocument()
  })
})
