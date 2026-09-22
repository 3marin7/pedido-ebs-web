import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CatalogoProductos from '../CatalogoProductos';
import { supabase } from '../supabaseClient';

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
