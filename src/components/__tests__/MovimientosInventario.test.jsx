import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MovimientosInventario, { normalizarMovimientoPayload } from '../MovimientosInventario';

const productosMock = [{ id: 1, nombre: 'Camiseta', stock: 5, precio: 120000 }];
const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
const mockRpc = jest.fn(() => Promise.resolve({
  data: null,
  error: { message: 'Could not find the function registrar_movimiento_inventario' },
}));
const mockUpdate = jest.fn(() => Promise.resolve({ error: null }));
const mockGetUser = jest.fn(() => Promise.resolve({
  data: { user: { email: 'admin@test.com', user_metadata: { role: 'admin' } } },
  error: null,
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    auth: { getUser: (...args) => mockGetUser(...args) },
    from: jest.fn((table) => {
      if (table === 'productos') {
        return {
          select: jest.fn((columns) => ({
            order: jest.fn(() => Promise.resolve({ data: productosMock, error: null })),
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: { id: 1, stock: 5 }, error: null })),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => mockUpdate()),
          })),
        };
      }

      if (table === 'movimientos_inventario') {
        return {
          insert: (...args) => mockInsert(...args),
        };
      }

      return {};
    }),
  },
}));

describe('MovimientosInventario', () => {
  beforeEach(() => {
    window.alert = jest.fn();
    mockRpc.mockClear();
    mockInsert.mockClear();
    mockUpdate.mockClear();
    mockGetUser.mockClear();
    mockRpc.mockResolvedValue({
      data: { stock_nuevo: 15, stock_anterior: 5, ya_registrado: false },
      error: null,
    });
  });

  test('renderiza el encabezado y el formulario de registro de movimientos', async () => {
    render(<MovimientosInventario />);

    expect(await screen.findByText('CONTROL DE INVENTARIO')).toBeInTheDocument();
    expect(screen.getByText('Registro de movimientos de productos')).toBeInTheDocument();
    expect(screen.getByText('🔍 Buscar Producto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar Movimiento' })).toBeInTheDocument();
    expect(screen.getByText('Camiseta - Stock: 5 - ID: 1')).toBeInTheDocument();
  });

  test('normaliza el payload de una entrada con la estructura correcta', () => {
    const payload = normalizarMovimientoPayload({
      movimiento: {
        producto_id: '1',
        tipo_movimiento: 'entrada',
        cantidad: '10',
        precio_unitario: '5000',
        motivo: 'compra',
        observaciones: 'Pedido de prueba',
      },
      requestId: '11111111-1111-4111-8111-111111111111',
    });

    expect(payload).toEqual(expect.objectContaining({
      p_request_id: '11111111-1111-4111-8111-111111111111',
      p_producto_id: 1,
      p_tipo_movimiento: 'entrada',
      p_cantidad: 10,
      p_precio_unitario: 5000,
      p_motivo: 'compra',
      p_observaciones: 'Pedido de prueba',
      p_descripcion: 'compra - Pedido de prueba',
    }));
  });

  test('normaliza el payload de una salida con cantidad y motivo correctos', () => {
    const payload = normalizarMovimientoPayload({
      movimiento: {
        producto_id: '1',
        tipo_movimiento: 'salida',
        cantidad: '2',
        precio_unitario: '',
        motivo: 'venta',
        observaciones: '',
      },
      requestId: '22222222-2222-4222-8222-222222222222',
    });

    expect(payload).toEqual(expect.objectContaining({
      p_request_id: '22222222-2222-4222-8222-222222222222',
      p_producto_id: 1,
      p_tipo_movimiento: 'salida',
      p_cantidad: 2,
      p_precio_unitario: null,
      p_motivo: 'venta',
      p_observaciones: null,
      p_descripcion: 'venta',
    }));
  });
});
