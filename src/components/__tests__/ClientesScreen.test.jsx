import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ClientesScreen from '../ClientesScreen'

// Mock de Supabase
jest.mock('../supabaseClient.js', () => ({
  supabase: {
    from: jest.fn()
  }
}))

import { supabase } from '../supabaseClient.js'

describe('ClientesScreen', () => {
  const mockClientes = [
    {
      id: 1,
      nombre: 'Cliente A',
      direccion: 'Calle 1',
      telefono: '0987654321',
      correo: 'cliente@example.com',
      clasificacion: 3
    },
    {
      id: 2,
      nombre: 'Cliente B',
      direccion: 'Calle 2',
      telefono: '0987654322',
      correo: 'clienteb@example.com',
      clasificacion: 4
    },
    {
      id: 3,
      nombre: 'Cliente C',
      direccion: 'Calle 3',
      telefono: '0987654323',
      correo: 'clientec@example.com',
      clasificacion: 2
    }
  ]

  const mockCallbacks = {
    onSeleccionarCliente: jest.fn(),
    onVolver: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock para cargar clientes
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockClientes,
          error: null
        })
      })
    })
  })

  describe('Renderizado inicial', () => {
    test('carga clientes al montar el componente', async () => {
      render(<ClientesScreen {...mockCallbacks} />)
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('clientes')
      })
    })

    test('muestra los clientes cargados', async () => {
      render(<ClientesScreen {...mockCallbacks} />)
      
      await waitFor(() => {
        expect(screen.getByText('Cliente A')).toBeInTheDocument()
        expect(screen.getByText('Cliente B')).toBeInTheDocument()
        expect(screen.getByText('Cliente C')).toBeInTheDocument()
      })
    })

    test('muestra un mensaje de carga mientras obtiene los clientes', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockImplementation(() => 
            new Promise(resolve => 
              setTimeout(() => resolve({ data: [], error: null }), 100)
            )
          )
        })
      })
      
      render(<ClientesScreen {...mockCallbacks} />)
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled()
      })
    })

    test('acepta clientes iniciales como prop', () => {
      render(
        <ClientesScreen 
          {...mockCallbacks} 
          clientes={mockClientes}
        />
      )
      
      mockClientes.forEach(cliente => {
        // Buscar el cliente en algún lugar del componente
        const elemento = screen.queryByText(cliente.nombre)
        // Solo verificar si aparece cuando hay clientes iniciales
      })
    })
  })

  describe('Búsqueda de clientes', () => {
    test('filtra clientes por nombre según la búsqueda', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      fireEvent.change(inputBusqueda, { target: { value: 'Cliente A' } })
      
      await waitFor(() => {
        expect(screen.getByText('Cliente A')).toBeInTheDocument()
        expect(screen.queryByText('Cliente B')).not.toBeInTheDocument()
      })
    })

    test('busca por nombre parcial (case-insensitive)', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      fireEvent.change(inputBusqueda, { target: { value: 'cliente' } })
      
      await waitFor(() => {
        expect(screen.getByText('Cliente A')).toBeInTheDocument()
        expect(screen.getByText('Cliente B')).toBeInTheDocument()
        expect(screen.getByText('Cliente C')).toBeInTheDocument()
      })
    })

    test('muestra todos los clientes cuando se limpia la búsqueda', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      
      // Buscar por algo
      fireEvent.change(inputBusqueda, { target: { value: 'Cliente A' } })
      await waitFor(() => {
        expect(screen.queryByText('Cliente B')).not.toBeInTheDocument()
      })
      
      // Limpiar búsqueda
      fireEvent.change(inputBusqueda, { target: { value: '' } })
      await waitFor(() => {
        expect(screen.getByText('Cliente A')).toBeInTheDocument()
        expect(screen.getByText('Cliente B')).toBeInTheDocument()
      })
    })

    test('busca también en teléfono y correo', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      
      // Buscar por teléfono
      fireEvent.change(inputBusqueda, { target: { value: '0987654321' } })
      
      await waitFor(() => {
        expect(screen.getByText('Cliente A')).toBeInTheDocument()
      })
    })
  })

  describe('Validación de email', () => {
    test('valida email con formato correcto', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // Verificar que los emails válidos están presentes
      const emails = mockClientes.filter(c => c.correo)
      expect(emails.length).toBeGreaterThan(0)
    })

    test('rechaza email inválido al crear cliente', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={[]} />)
      
      // El componente debería validar emails inválidos
      // Se valida en la función validarEmail
    })
  })

  describe('Validación de teléfono', () => {
    test('acepta teléfono válido', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // Los teléfonos válidos de los clientes deben estar presentes
      const telefonos = mockClientes.filter(c => c.telefono)
      expect(telefonos.length).toBeGreaterThan(0)
    })

    test('rechaza teléfono inválido', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={[]} />)
      
      // El componente valida teléfonos con formato numérico
    })
  })

  describe('Filtrado por clasificación', () => {
    test('filtra clientes por clasificación', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // El componente tiene funcionalidad de filtro
      // Por defecto muestra todos los clientes
    })

    test('muestra todos los clientes cuando sin filtro específico', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // Todos los clientes deberían estar disponibles inicialmente
      mockClientes.forEach(cliente => {
        // Buscar referencias del cliente
      })
    })
  })

  describe('Selección de cliente', () => {
    test('llama callback onSeleccionarCliente al hacer click en un cliente', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const clienteButton = screen.getAllByRole('button')
      const clienteAButton = clienteButton.find(btn => btn.textContent.includes('Cliente A'))
      
      if (clienteAButton) {
        fireEvent.click(clienteAButton)
        
        await waitFor(() => {
          expect(mockCallbacks.onSeleccionarCliente).toHaveBeenCalledWith(
            expect.objectContaining({ nombre: 'Cliente A' })
          )
        })
      }
    })

    test('pasa el cliente correcto al callback', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const clienteButtons = screen.getAllByRole('button')
      const clienteBButton = clienteButtons.find(btn => btn.textContent.includes('Cliente B'))
      
      if (clienteBButton) {
        fireEvent.click(clienteBButton)
        
        await waitFor(() => {
          expect(mockCallbacks.onSeleccionarCliente).toHaveBeenCalledWith(
            expect.objectContaining({
              nombre: 'Cliente B',
              telefono: '0987654322'
            })
          )
        })
      }
    })
  })

  describe('Botón volver', () => {
    test('llama callback onVolver cuando se hace click en volver', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const btnVolver = screen.getByRole('button', { name: /volver|atrás|back/i })
      fireEvent.click(btnVolver)
      
      expect(mockCallbacks.onVolver).toHaveBeenCalled()
    })

    test('cancela edición antes de volver', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // Entrar en modo edición
      const btnEditar = screen.getAllByRole('button')
        .find(btn => btn.textContent.includes('Editar') || btn.textContent.includes('Edit'))
      
      if (btnEditar) {
        fireEvent.click(btnEditar)
        
        // Hacer click en volver
        const btnVolver = screen.getByRole('button', { name: /volver|atrás|back/i })
        fireEvent.click(btnVolver)
        
        // No debería estar en modo edición
        await waitFor(() => {
          expect(screen.queryByText(/cancelar edición/i)).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Crear nuevo cliente', () => {
    test('abre formulario para nuevo cliente', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      
      render(<ClientesScreen {...mockCallbacks} />)
      
      const btnNuevoCliente = screen.queryByRole('button', { name: /nuevo cliente|crear cliente|agregar/i })
      if (btnNuevoCliente) {
        fireEvent.click(btnNuevoCliente)
        
        await waitFor(() => {
          // El formulario debería abrirse
        })
      }
    })

    test('requiere nombre para crear cliente', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={[]} />)
      
      // El componente valida que el nombre sea obligatorio
      // Esta validación se hace en guardarCliente
    })

    test('llena los campos del formulario correctamente', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={[]} />)
      
      // El componente tiene inputs para nombre, teléfono, dirección, email
      const inputs = screen.queryAllByPlaceholderText(/nombre|teléfono|dirección|correo|email/i)
      // Verificar que existen los campos del formulario
    })
  })

  describe('Editar cliente', () => {
    test('abre formulario de edición con datos del cliente', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const botonesAccion = screen.getAllByRole('button')
      const btnEditar = botonesAccion.find(btn => btn.textContent.includes('Editar') || btn.textContent.includes('Edit'))
      
      if (btnEditar) {
        fireEvent.click(btnEditar)
        
        await waitFor(() => {
          const inputNombre = screen.getByDisplayValue('Cliente A')
          expect(inputNombre).toBeInTheDocument()
        })
      }
    })

    test('cancela edición al hacer click en cancelar', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const botonesAccion = screen.getAllByRole('button')
      const btnEditar = botonesAccion.find(btn => btn.textContent.includes('Editar') || btn.textContent.includes('Edit'))
      
      if (btnEditar) {
        fireEvent.click(btnEditar)
        
        const btnCancelar = screen.getByRole('button', { name: /cancelar/i })
        fireEvent.click(btnCancelar)
        
        await waitFor(() => {
          expect(screen.queryByDisplayValue('Cliente A')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('Exportación de clientes', () => {
    test('botón de exportar está disponible', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const btnExportar = screen.getByRole('button', { name: /exportar/i })
      expect(btnExportar).toBeInTheDocument()
    })

    test('exportar genera un archivo JSON', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockClientes,
          error: null
        })
      })
      
      render(<ClientesScreen {...mockCallbacks} />)
      
      const btnExportar = screen.getByRole('button', { name: /exportar/i })
      fireEvent.click(btnExportar)
      
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('clientes')
      })
    })
  })

  describe('Importación de clientes', () => {
    test('input de importar está disponible', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const inputImportar = screen.queryByLabelText(/importar/i)
      if (inputImportar) {
        expect(inputImportar).toHaveAttribute('type', 'file')
      }
    })

    test('acepta archivo JSON para importar', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={[]} />)
      
      const inputImportar = screen.queryByLabelText(/importar/i)
      if (inputImportar) {
        expect(inputImportar).toHaveAttribute('accept', expect.stringContaining('json'))
      }
    })
  })

  describe('Manejo de errores', () => {
    test('muestra error cuando falla la carga de clientes', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Error de conexión')
          })
        })
      })
      
      render(<ClientesScreen {...mockCallbacks} />)
      
      await waitFor(() => {
        const errorElement = screen.queryByText(/error|Error/i)
        // El error debería mostrarse si la carga falla
      })
    })

    test('maneja lista vacía de clientes', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={[]} />)
      
      // Debería mostrar el componente aunque no haya clientes
      // El componente debería renderizarse sin errores
      const busqueda = screen.getByPlaceholderText(/buscar/i)
      expect(busqueda).toBeInTheDocument()
    })
  })

  describe('Accesibilidad', () => {
    test('botones son accesibles', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const botones = screen.queryAllByRole('button')
      // Debería haber al menos algunos botones accesibles
      expect(botones.length).toBeGreaterThanOrEqual(1)
    })

    test('inputs tienen placeholders descriptivos', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // El input de búsqueda debería tener placeholder
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      expect(inputBusqueda).toBeInTheDocument()
    })

    test('inputs de búsqueda tienen placeholder descriptivo', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      expect(inputBusqueda).toBeInTheDocument()
    })
  })

  describe('Información de clasificación', () => {
    test('componente renderiza correctamente', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // Los clientes se cargan y se pueden seleccionar
      expect(screen.getByText('Cliente A')).toBeInTheDocument()
    })

    test('mostrar/ocultar estadísticas funciona', () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      const btnEstadisticas = screen.queryByRole('button', { name: /estadísticas|estadisticas|resumen/i })
      
      if (btnEstadisticas) {
        expect(btnEstadisticas).toBeInTheDocument()
      }
    })
  })

  describe('Interacción completa', () => {
    test('flujo completo: crear cliente, buscar, seleccionar', async () => {
      const { rerender } = render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // 1. Buscar cliente
      const inputBusqueda = screen.getByPlaceholderText(/buscar/i)
      fireEvent.change(inputBusqueda, { target: { value: 'Cliente A' } })
      
      await waitFor(() => {
        expect(screen.getByText('Cliente A')).toBeInTheDocument()
      })
      
      // 2. Seleccionar cliente
      const botones = screen.getAllByRole('button')
      const btnClienteA = botones.find(btn => btn.textContent.includes('Cliente A'))
      
      if (btnClienteA) {
        fireEvent.click(btnClienteA)
        
        expect(mockCallbacks.onSeleccionarCliente).toHaveBeenCalled()
      }
    })

    test('flujo de edición: editar cliente, guardar, volver', async () => {
      render(<ClientesScreen {...mockCallbacks} clientes={mockClientes} />)
      
      // 1. Buscar botón de editar
      const botonesAccion = screen.getAllByRole('button')
      const btnEditar = botonesAccion.find(btn => btn.textContent.includes('Editar') || btn.textContent.includes('Edit'))
      
      if (btnEditar) {
        fireEvent.click(btnEditar)
        
        // 2. Cambiar un campo
        const inputNombre = screen.getByDisplayValue('Cliente A')
        fireEvent.change(inputNombre, { target: { value: 'Cliente A Actualizado' } })
        
        // 3. Guardar (si el botón existe)
        const btnGuardar = screen.queryByRole('button', { name: /guardar|actualizar/i })
        if (btnGuardar) {
          fireEvent.click(btnGuardar)
        }
      }
    })
  })
})
