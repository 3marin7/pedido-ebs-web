import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvoiceScreen from '../InvoiceScreen';
import { AuthContext } from '../../App';

const mockClientes = [
  {
    id: 1,
    nombre: 'MARÍA GONZÁLEZ',
    telefono: '3001234567',
    direccion: 'Calle 10',
    correo: '',
    codigo_cliente: 'C-001',
    clasificacion: 3,
    centro_comercial: 'CC Central'
  }
];

// Registro de las escrituras a la tabla clientes
const mockUpdates = [];

// Consulta encadenable de Supabase: responde clientes (o vacío) y registra los update
const mockConsulta = (tabla) => {
  const resultado = tabla === 'clientes' ? { data: mockClientes, error: null } : { data: [], error: null };
  const consulta = {};
  ['select', 'eq', 'neq', 'order', 'range', 'not', 'in', 'gte', 'lte', 'limit', 'ilike', 'or', 'gt', 'lt', 'is', 'insert', 'delete'].forEach((metodo) => {
    consulta[metodo] = jest.fn(() => consulta);
  });
  consulta.update = jest.fn((datos) => {
    mockUpdates.push({ tabla, datos });
    return consulta;
  });
  consulta.maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  consulta.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
  consulta.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
  return consulta;
};

jest.mock('../supabaseClient', () => ({
  supabase: { from: jest.fn((tabla) => mockConsulta(tabla)) }
}));

jest.mock('../supabaseClient.js', () => ({
  supabase: { from: jest.fn((tabla) => mockConsulta(tabla)) }
}));

const renderFactura = (role) =>
  render(
    <AuthContext.Provider value={{ user: { id: 'u1', email: 'u@test.com', username: 'u', role, name: 'Usuario' } }}>
      <MemoryRouter>
        <InvoiceScreen />
      </MemoryRouter>
    </AuthContext.Provider>
  );

const campoNombre = () => screen.getByPlaceholderText(/nombre del cliente/i);
const campoTelefono = () => screen.getByPlaceholderText(/teléfono opcional/i);

describe('InvoiceScreen - selección de clientes por rol', () => {
  beforeEach(() => {
    mockUpdates.length = 0;
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  test.each(['admin', 'superadmin', 'inventario'])(
    'el rol %s ve el botón y la lista con opción de editar',
    async (role) => {
      renderFactura(role);

      fireEvent.click(await screen.findByRole('button', { name: /seleccionar o editar cliente/i }));

      expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hacer pedido/i })).toBeInTheDocument();
    }
  );

  test.each(['admin', 'inventario'])(
    'el rol %s elige un cliente: se llenan sus datos y puede corregirlos',
    async (role) => {
      renderFactura(role);

      fireEvent.click(await screen.findByRole('button', { name: /seleccionar o editar cliente/i }));
      fireEvent.click(await screen.findByText('MARÍA GONZÁLEZ'));

      await waitFor(() => expect(campoNombre()).toHaveValue('MARÍA GONZÁLEZ'));
      expect(campoTelefono()).toHaveValue('3001234567');
      expect(campoNombre()).not.toHaveAttribute('readonly');
      expect(campoTelefono()).not.toHaveAttribute('readonly');

      fireEvent.change(campoTelefono(), { target: { value: '3111111111' } });
      expect(campoTelefono()).toHaveValue('3111111111');
    }
  );

  test('inventario puede editar un cliente desde la lista y se guarda en la base de datos', async () => {
    renderFactura('inventario');

    fireEvent.click(await screen.findByRole('button', { name: /seleccionar o editar cliente/i }));
    fireEvent.click(await screen.findByRole('button', { name: /editar/i }));

    const telefono = await screen.findByDisplayValue('3001234567');
    fireEvent.change(telefono, { target: { value: '3229998888' } });
    fireEvent.click(screen.getByRole('button', { name: /actualizar cliente/i }));

    await waitFor(() => {
      expect(mockUpdates.some((u) => u.tabla === 'clientes' && u.datos.telefono === '3229998888')).toBe(true);
    });
  });

  test('el vendedor puede consultar y seleccionar clientes, sin editarlos', async () => {
    renderFactura('vendedor');

    fireEvent.click(await screen.findByRole('button', { name: /consultar y seleccionar cliente/i }));

    expect(await screen.findByRole('button', { name: /^seleccionar cliente$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });

  test('el vendedor elige un cliente: se llenan sus datos y quedan bloqueados', async () => {
    renderFactura('vendedor');

    fireEvent.click(await screen.findByRole('button', { name: /consultar y seleccionar cliente/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^seleccionar cliente$/i }));

    await waitFor(() => expect(campoNombre()).toHaveValue('MARÍA GONZÁLEZ'));
    expect(campoTelefono()).toHaveValue('3001234567');
    expect(campoNombre()).toHaveAttribute('readonly');
    expect(campoTelefono()).toHaveAttribute('readonly');
  });
});
