import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

jest.mock('../../App', () => ({
  useAuth: jest.fn()
}))

import { useAuth } from '../../App'
import { supabase } from '../../lib/supabase'

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>)

describe('Login', () => {
  const loginMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    loginMock.mockResolvedValue({ error: null })
    useAuth.mockReturnValue({ login: loginMock })
  })

  test('renderiza el formulario y el acceso al catálogo', () => {
    renderWithRouter(<Login />)

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar al sistema/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver catálogo completo/i })).toHaveAttribute('href', '/catalogo-clientes')
  })

  test('envía el correo y la contraseña a la autenticación de Supabase', async () => {
    renderWithRouter(<Login />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'edwin@example.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'new-secure-password' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('edwin@example.com', 'new-secure-password')
    })
  })

  test('muestra un mensaje genérico cuando Supabase rechaza el acceso', async () => {
    loginMock.mockResolvedValue({ error: new Error('Invalid login credentials') })
    renderWithRouter(<Login />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'edwin@example.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }))

    expect(await screen.findByText(/no se pudo iniciar sesión/i)).toBeInTheDocument()
  })

  test('solicita un enlace para restablecer la contraseña', async () => {
    renderWithRouter(<Login />)

    fireEvent.click(screen.getByRole('button', { name: /olvidé mi contraseña/i }))
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'edwin@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }))

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('edwin@example.com', {
        redirectTo: `${window.location.origin}/actualizar-contrasena`,
      })
    })
    expect(await screen.findByRole('status')).toHaveTextContent(/recibirás un enlace/i)
  })

  test('muestra la información del catálogo para usuarios sin cuenta', () => {
    renderWithRouter(<Login />)

    expect(screen.getByText(/explora nuestro catálogo/i)).toBeInTheDocument()
    expect(screen.getByText(/descubre todos nuestros productos/i)).toBeInTheDocument()
  })
})
