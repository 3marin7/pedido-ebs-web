import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CatalogoProductos from '../CatalogoProductos';
import { supabase } from '../supabaseClient';

jest.mock('../../lib/inventoryUtils', () => ({
  getProductSalesAndRecommendations: jest.fn().mockResolvedValue([]),
  mergeRecommendationsIntoProducts: jest.fn((productos) => productos),
}));

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../App', () => ({
  useAuth: () => ({
    user: {
      role: 'admin',
      username: 'admin-test',
    },
  }),
}));

describe('CatalogoProductos - revisión de inventario', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            nombre: 'Toalla Premium',
            codigo: 'T-001',
            categoria: 'Toallas',
            precio: 12000,
            stock: 10,
            activo: true,
            descripcion: 'Toalla',
            created_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 2,
            nombre: 'Pañal Infantil',
            codigo: 'P-002',
            categoria: 'Pañales',
            precio: 15000,
            stock: 8,
            activo: true,
            descripcion: 'Pañal',
            created_at: '2026-01-02T00:00:00.000Z',
          },
        ],
        error: null,
      }),
    });
  });

  test('debe mostrar la vista de revisión con filtros de estado', async () => {
    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Catálogo de Productos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));

    expect(screen.getByText('Revisión de inventario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pendientes/i })).toBeInTheDocument();
    expect(screen.getByText('Toalla Premium')).toBeInTheDocument();
  });

  test('debe conservar el stock actual del producto aunque el historial tenga una cantidad anterior', async () => {
    supabase.from.mockImplementation((tabla) => {
      const data = tabla === 'productos'
        ? [{
            id: 78,
            nombre: 'Huggies Etapa 3',
            categoria: 'Pañales',
            precio: 36000,
            stock: 78,
            activo: true,
          }]
        : [{
            producto_id: 78,
            cantidad_sistema: 78,
            cantidad_real: 0,
            estado_revision: 'diferencia',
          }];

      return {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data, error: null }),
      };
    });

    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await screen.findByText('Huggies Etapa 3');

    expect(screen.getByText('Stock: 78')).toBeInTheDocument();
  });

  test('debe mostrar el total del inventario verificado y su ajuste en la vista activa', async () => {
    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Catálogo de Productos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));
    fireEvent.click(screen.getByRole('button', { name: /Verificados/i }));

    await waitFor(() => {
      expect(screen.getByText(/Total verificados/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Ajuste/i).length).toBeGreaterThan(0);
    });
  });

  test('debe mostrar un resumen total real al final del panel de revisión', async () => {
    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Catálogo de Productos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));

    await waitFor(() => {
      expect(screen.getByText('Total inventario real')).toBeInTheDocument();
      expect(screen.getAllByText('18 unidades').length).toBeGreaterThan(0);
      expect(screen.getByText('Valor total real')).toBeInTheDocument();
    });
  });

  test('debe volver a poner en pendiente un producto cuya revisión trimestral ya venció', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: 3,
              nombre: 'Caja de prueba',
              codigo: 'C-003',
              categoria: 'Otros',
              precio: 5000,
              stock: 12,
              activo: true,
              descripcion: 'Prueba',
              created_at: '2026-01-01T00:00:00.000Z',
              fecha_revision: '2026-01-01T00:00:00.000Z',
              fecha_proxima_revision: '2026-04-01T00:00:00.000Z',
              estado_revision: 'verificado'
            }],
            error: null,
          }),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      };
    });

    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Catálogo de Productos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));

    await waitFor(() => {
      expect(screen.getByText('Caja de prueba')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Pendientes$/i })).toBeInTheDocument();
    });
  });

  test('debe conservar el estado ajustado cuando el producto ya fue corregido en inventario', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: 5,
              nombre: 'Tena pants X16 talla',
              codigo: 'TP-016',
              categoria: 'Pañales',
              precio: 45000,
              stock: 16,
              cantidad_sistema: 15,
              cantidad_real: 16,
              diferencia: 1,
              activo: true,
              estado_revision: 'ajustado',
              descripcion: 'Tena pants',
              created_at: '2026-01-01T00:00:00.000Z',
            }],
            error: null,
          }),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      };
    });

    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tena pants X16 talla')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));

    await waitFor(() => {
      const nombreProducto = screen.getByText('Tena pants X16 talla');
      const fila = nombreProducto.closest('tr');
      expect(fila).not.toBeNull();
      expect(within(fila).getByText('Ajustados')).toBeInTheDocument();
    });
  });

  test('debe dejar en ajustado un producto que estaba en cero y recibió +1', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: 8,
              nombre: 'Tena pants X16 talla',
              codigo: 'TP-020',
              categoria: 'Pañales',
              precio: 45000,
              stock: 0,
              cantidad_sistema: 0,
              cantidad_real: 1,
              diferencia: 1,
              activo: true,
              estado_revision: 'ajustado',
              descripcion: 'Producto con ajuste desde cero',
              created_at: '2026-01-01T00:00:00.000Z',
            }],
            error: null,
          }),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      };
    });

    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tena pants X16 talla')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));

    await waitFor(() => {
      const fila = screen.getByText('Tena pants X16 talla').closest('tr');
      expect(fila).not.toBeNull();
      expect(fila.textContent).toContain('Ajustados');
      expect(fila.textContent).toContain('1');
    });
  });

  test('debe seguir siendo verificado cuando el stock queda en cero y no hubo diferencia', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: 9,
              nombre: 'Producto verificado en cero',
              codigo: 'TP-030',
              categoria: 'Pañales',
              precio: 45000,
              stock: 0,
              cantidad_sistema: 0,
              cantidad_real: 0,
              diferencia: 0,
              activo: true,
              estado_revision: 'verificado',
              descripcion: 'Sin ajuste',
              created_at: '2026-01-01T00:00:00.000Z',
            }],
            error: null,
          }),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      };
    });

    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Producto verificado en cero')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));

    await waitFor(() => {
      const fila = screen.getByText('Producto verificado en cero').closest('tr');
      expect(fila).not.toBeNull();
      expect(fila.textContent).toContain('Verificados');
    });
  });

  test('debe avisar cuando la revisión no se guarda en base de datos', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    supabase.from.mockImplementation((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: 1,
              nombre: 'Toalla Premium',
              codigo: 'T-001',
              categoria: 'Toallas',
              precio: 12000,
              stock: 10,
              activo: true,
              descripcion: 'Toalla',
              created_at: '2026-01-01T00:00:00.000Z',
            }],
            error: null,
          }),
          update: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: { message: 'missing column' } }),
          })),
        };
      }

      if (table === 'inventario_revisiones') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }

      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    });

    render(
      <MemoryRouter>
        <CatalogoProductos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Toalla Premium')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Revisión/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Verificar/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Guardar revisión/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('No se pudo guardar la revisión'));
    });

    alertSpy.mockRestore();
  });
});
