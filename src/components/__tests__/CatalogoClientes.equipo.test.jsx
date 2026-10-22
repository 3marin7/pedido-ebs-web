import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogoClientes from '../CatalogoClientes';
import { AuthContext } from '../../App';
import { supabase } from '../supabaseClient';
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

const mockClientes = [
  { id: 10, nombre: 'MARÍA GONZÁLEZ', telefono: '3001234567', direccion: 'Calle 10 #5-20', codigo_cliente: 'C-010' },
  { id: 11, nombre: 'PEDRO RAMÍREZ', telefono: '3109876543', direccion: 'Carrera 7 #3-15', codigo_cliente: 'C-011' }
];

// Almacenamiento del dispositivo en memoria (en jsdom no hay IndexedDB)
const mockStore = new Map();
jest.mock('localforage', () => ({
  createInstance: () => ({
    getItem: async (clave) => (mockStore.has(clave) ? mockStore.get(clave) : null),
    setItem: async (clave, valor) => {
      mockStore.set(clave, valor);
      return valor;
    },
    removeItem: async (clave) => {
      mockStore.delete(clave);
    }
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn()
}));

// Consulta encadenable de Supabase: responde productos o clientes según la tabla
const mockConsulta = (resultado) => {
  const consulta = {};
  ['select', 'eq', 'order', 'range', 'not', 'in', 'gte', 'lte', 'limit'].forEach((metodo) => {
    consulta[metodo] = jest.fn(() => consulta);
  });
  consulta.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
  return consulta;
};

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn((tabla) =>
      mockConsulta(tabla === 'clientes'
        ? { data: mockClientes, error: null }
        : { data: mockProductos, error: null })
    )
  }
}));

const VENDEDOR = { id: 'u1', email: 'edwin@test.com', username: 'edwin', role: 'vendedor', name: 'Edwin Marín' };
const CLIENTE = { id: 'u2', email: 'cliente@test.com', username: 'cliente', role: 'cliente', name: 'Tienda X' };

const renderCatalogo = (user) => {
  if (user === undefined) return render(<CatalogoClientes />);
  return render(
    <AuthContext.Provider value={{ user }}>
      <CatalogoClientes />
    </AuthContext.Provider>
  );
};

// Agrega el producto de prueba al carrito, lo que abre el formulario del pedido
const agregarProductoAlCarrito = async () => {
  await screen.findByText('Camiseta Test');
  fireEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  return screen.findByLabelText(/nombre completo/i);
};

const llamoTablaClientes = () => supabase.from.mock.calls.some(([tabla]) => tabla === 'clientes');

describe('CatalogoClientes - ayudas del pedido para el equipo', () => {
  beforeEach(() => {
    mockStore.clear();
    useLocation.mockReturnValue({ search: '' });
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('búsqueda de clientes', () => {
    test('el vendedor encuentra al cliente sin importar tildes ni mayúsculas y llena sus datos', async () => {
      renderCatalogo(VENDEDOR);
      const nombre = await agregarProductoAlCarrito();

      fireEvent.focus(nombre);
      fireEvent.change(nombre, { target: { name: 'nombre', value: 'gonzalez' } });

      const sugerencia = await screen.findByRole('button', { name: /maría gonzález/i });
      fireEvent.click(sugerencia);

      expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('MARÍA GONZÁLEZ');
      expect(screen.getByLabelText(/teléfono/i)).toHaveValue('3001234567');
      expect(screen.getByLabelText(/dirección/i)).toHaveValue('Calle 10 #5-20');
      expect(screen.getByText(/cliente cargado desde bd/i)).toBeInTheDocument();
    });

    test('el vendedor puede buscar por teléfono', async () => {
      renderCatalogo(VENDEDOR);
      const nombre = await agregarProductoAlCarrito();

      fireEvent.focus(nombre);
      fireEvent.change(nombre, { target: { name: 'nombre', value: '9876' } });

      expect(await screen.findByRole('button', { name: /pedro ramírez/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /maría gonzález/i })).not.toBeInTheDocument();
    });

    test('avisa cuando el cliente no está en la base de datos', async () => {
      renderCatalogo(VENDEDOR);
      const nombre = await agregarProductoAlCarrito();
      await waitFor(() => expect(llamoTablaClientes()).toBe(true));

      fireEvent.focus(nombre);
      fireEvent.change(nombre, { target: { name: 'nombre', value: 'Cliente Inexistente' } });

      expect(await screen.findByText(/no está en la base de datos/i)).toBeInTheDocument();
    });

    test('un visitante sin sesión no consulta ni ve la lista de clientes', async () => {
      renderCatalogo();
      const nombre = await agregarProductoAlCarrito();

      fireEvent.focus(nombre);
      fireEvent.change(nombre, { target: { name: 'nombre', value: 'gonzalez' } });

      await new Promise((r) => setTimeout(r, 50));
      expect(screen.queryByRole('button', { name: /maría gonzález/i })).not.toBeInTheDocument();
      expect(llamoTablaClientes()).toBe(false);
    });

    test('un usuario con rol cliente no consulta ni ve la lista de clientes', async () => {
      renderCatalogo(CLIENTE);
      const nombre = await agregarProductoAlCarrito();

      fireEvent.focus(nombre);
      fireEvent.change(nombre, { target: { name: 'nombre', value: 'gonzalez' } });

      await new Promise((r) => setTimeout(r, 50));
      expect(screen.queryByRole('button', { name: /maría gonzález/i })).not.toBeInTheDocument();
      expect(llamoTablaClientes()).toBe(false);
    });
  });

  describe('vendedor automático', () => {
    test('el vendedor conectado queda seleccionado aunque su nombre tenga tilde', async () => {
      renderCatalogo(VENDEDOR);
      await agregarProductoAlCarrito();

      await waitFor(() => {
        expect(screen.getByLabelText(/vendedor/i)).toHaveValue('Edwin Marin');
      });
    });

    test('para un visitante sin sesión el vendedor queda vacío', async () => {
      renderCatalogo();
      await agregarProductoAlCarrito();

      expect(screen.getByLabelText(/vendedor/i)).toHaveValue('');
    });
  });

  describe('borrador del pedido', () => {
    test('el pedido del vendedor se recupera al volver a la pantalla', async () => {
      const { unmount } = renderCatalogo(VENDEDOR);
      const nombre = await agregarProductoAlCarrito();
      fireEvent.change(nombre, { target: { name: 'nombre', value: 'Tienda La Esquina' } });

      await waitFor(() => expect(mockStore.get('borrador_pedido_1')?.productosSeleccionados).toHaveLength(1));
      unmount();

      renderCatalogo(VENDEDOR);

      expect(await screen.findByText(/recuperamos tu pedido sin enviar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('Tienda La Esquina');
    });

    test('"Empezar de nuevo" descarta el pedido recuperado', async () => {
      const { unmount } = renderCatalogo(VENDEDOR);
      await agregarProductoAlCarrito();
      await waitFor(() => expect(mockStore.has('borrador_pedido_1')).toBe(true));
      unmount();

      jest.spyOn(window, 'confirm').mockReturnValue(true);
      renderCatalogo(VENDEDOR);
      fireEvent.click(await screen.findByRole('button', { name: /empezar de nuevo/i }));

      await waitFor(() => expect(mockStore.has('borrador_pedido_1')).toBe(false));
      expect(screen.queryByText(/recuperamos tu pedido sin enviar/i)).not.toBeInTheDocument();
      window.confirm.mockRestore();
    });

    test('para un visitante sin sesión no se guarda borrador', async () => {
      renderCatalogo();
      await agregarProductoAlCarrito();

      await new Promise((r) => setTimeout(r, 50));
      expect(mockStore.has('borrador_pedido_1')).toBe(false);
    });
  });
});
