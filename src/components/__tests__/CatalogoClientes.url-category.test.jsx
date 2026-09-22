import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CatalogoClientes from '../CatalogoClientes';
import { supabase } from '../supabaseClient';

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('CatalogoClientes - URL con categoría', () => {
  beforeEach(() => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            nombre: 'Producto Toalla',
            precio: 12000,
            categoria: 'Toallas',
            descripcion: 'Toalla de prueba',
            imagen_url: '',
            stock: 10,
            activo: true,
            created_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 2,
            nombre: 'Producto Pañal',
            precio: 15000,
            categoria: 'Pañales',
            descripcion: 'Pañal de prueba',
            imagen_url: '',
            stock: 8,
            activo: true,
            created_at: '2026-01-02T00:00:00.000Z',
          },
        ],
        error: null,
      }),
    };

    supabase.from.mockReturnValue(queryBuilder);
  });

  test('debe cargar la categoría desde la URL y filtrar los productos', async () => {
    render(
      <MemoryRouter initialEntries={['/catalogo-clientes?categoria=Toallas']}>
        <Routes>
          <Route path="/catalogo-clientes" element={<CatalogoClientes />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Producto Toalla')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Producto Pañal')).not.toBeInTheDocument();
    });
  });
});
