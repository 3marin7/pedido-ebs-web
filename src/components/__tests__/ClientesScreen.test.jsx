import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import ClientesScreen from '../ClientesScreen'

jest.mock('../supabaseClient.js', () => ({
  supabase: {
    from: jest.fn()
  }
}))

import { supabase } from '../supabaseClient.js'

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>)

describe('ClientesScreen', () => {
  const mockClientes = [
    { id: 1, nombre: 'Cliente A', direccion: 'Calle 1', telefono: '0987654321', correo: 'cliente@example.com', clasificacion: 3 },
    { id: 2, nombre: 'Cliente B', direccion: 'Calle 2', telefono: '0987654322', correo: 'clienteb@example.com', clasificacion: 4 },
    { id: 3, nombre: 'Cliente C', direccion: 'Calle 3', telefono: '0987654323', correo: 'clientec@example.com', clasificacion: 2 }
  ]

  const mockCallbacks = {
    onSeleccionarCliente: jest.fn(),
    onVolver: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockClientes,
          error: null
        })
      })
    })
  })

  test('carga los clientes al montar el componente', async () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} />)

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('clientes')
    })

    expect(screen.getByText('Cliente A')).toBeInTheDocument()
    expect(screen.getByText('Cliente B')).toBeInTheDocument()
  })

  test('muestra la búsqueda y los controles principales', () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)

    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /exportar clientes/i })).toBeInTheDocument()
  })

  test('filtra clientes por nombre', async () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)

    fireEvent.change(screen.getByPlaceholderText(/buscar/i), { target: { value: 'Cliente B' } })

    await waitFor(() => {
      expect(screen.getByText('Cliente B')).toBeInTheDocument()
      expect(screen.queryByText('Cliente A')).not.toBeInTheDocument()
    })
  })

  test('llama al callback onVolver al pulsar volver', () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)

    fireEvent.click(screen.getByRole('button', { name: /volver/i }))

    expect(mockCallbacks.onVolver).toHaveBeenCalledTimes(1)
  })

  test('muestra el formulario para crear un cliente', () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={[]} />)

    expect(screen.getByText(/agregar nuevo cliente/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ej: \+57 1234567890/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ej: cliente@ejemplo.com/i)).toBeInTheDocument()
  })

  test('permite editar un campo del formulario', () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)

    fireEvent.change(screen.getByPlaceholderText(/nombre completo/i), { target: { value: 'Cliente nuevo' } })

    expect(screen.getByPlaceholderText(/nombre completo/i)).toHaveValue('Cliente nuevo')
  })

  test('expone un input para importar clientes con formato JSON', () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)

    const inputImportar = document.getElementById('importar-clientes')
    expect(inputImportar).toHaveAttribute('accept', '.json,application/json')
    expect(inputImportar).toHaveAttribute('type', 'file')
  })

  test('muestra un mensaje de error si falla la carga', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Error de conexión')
        })
      })
    })

    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={[]} />)

    await waitFor(() => {
      expect(screen.getByText(/error al cargar clientes/i)).toBeInTheDocument()
    })
  })

  test('muestra la lista vacía sin romper el render si no hay clientes', () => {
    renderWithRouter(<ClientesScreen {...mockCallbacks} clientes={[]} />)

    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
    expect(screen.getByText(/agregar nuevo cliente/i)).toBeInTheDocument()
  })
})
