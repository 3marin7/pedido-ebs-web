import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogoClientes from '../CatalogoClientes';
import { useLocation } from 'react-router-dom';

const mockProductos = [
  {
    id: 1,
    codigo: 'P-001',
    nombre: 'Camiseta Test',
    precio: 25000,
    categoria: 'Ropa',
    descripcion: 'Camiseta de prueba',
    imagen_url: 'https://example.com/test.jpg',
    stock: 10,
    activo: true,
    created_at: '2026-08-01T00:00:00.000Z'
  }
];

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn()
}));

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: mockProductos, error: null }))
        }))
      }))
    }))
  }
}));

describe('CatalogoClientes - carrito y envío', () => {
  beforeEach(() => {
    useLocation.mockReturnValue({ search: '' });
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('debe llevar al formulario cuando faltan datos del cliente antes de enviar', async () => {
    render(<CatalogoClientes />);

    await screen.findByText('Camiseta Test');

    fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /seguir comprando/i })).toBeInTheDocument();
      expect(screen.getByText(/completa tus datos para enviar el pedido/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /enviar pedido por whatsapp/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/por favor selecciona un vendedor válido/i).length).toBeGreaterThan(0);
    });

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
