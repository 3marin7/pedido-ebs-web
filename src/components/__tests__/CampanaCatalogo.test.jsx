import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampanaCatalogo from '../CampanaCatalogo';

const mockTableData = {
  clientes: [
    {
      id: 1,
      nombre: 'CRISTINA DROGUERIA ARLET',
      telefono: '3222466661',
      clasificacion: 3,
      centro_comercial: 'Droguerias'
    },
    {
      id: 2,
      nombre: 'TIENDA DEL CENTRO',
      telefono: '3001234567',
      clasificacion: 3,
      centro_comercial: 'CC ferrocarril'
    }
  ],
  facturas: [],
  abonos: []
};

const mockFrom = jest.fn((tableName) => ({
  select: jest.fn(() => ({
    range: jest.fn(async () => ({
      data: mockTableData[tableName] || [],
      error: null
    }))
  }))
}));

jest.mock('../supabaseClient', () => ({
  supabase: {
    from: (...args) => mockFrom(...args)
  }
}));

describe('CampanaCatalogo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    Object.defineProperty(window, 'open', {
      writable: true,
      value: jest.fn()
    });

    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });
  });

  test('renderiza clientes aptos con datos cargados desde Supabase', async () => {
    render(<CampanaCatalogo />);

    await waitFor(() => {
      expect(screen.getByText('CRISTINA DROGUERIA ARLET')).toBeInTheDocument();
    });

    expect(screen.getByText('Clientes aptos para compartir catálogo')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Enviar por WhatsApp' }).length).toBeGreaterThan(0);
  });

  test('bloquea envio por WhatsApp cuando no hay URL publica valida', async () => {
    render(<CampanaCatalogo />);

    await waitFor(() => {
      expect(screen.getByText('CRISTINA DROGUERIA ARLET')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Enviar por WhatsApp' })[0]);

    expect(
      screen.getByText(/No se puede enviar por WhatsApp mientras la URL p[uú]blica siga vac[ií]a o apunte a localhost/i)
    ).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });

  test('guarda URL publica y envia mensaje con link correcto por WhatsApp', async () => {
    render(<CampanaCatalogo />);

    await waitFor(() => {
      expect(screen.getByText('CRISTINA DROGUERIA ARLET')).toBeInTheDocument();
    });

    const inputUrl = screen.getByPlaceholderText('https://tu-dominio.com');
    fireEvent.change(inputUrl, { target: { value: 'https://pedido-ebs-web.vercel.app' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar URL p[uú]blica/i }));

    await waitFor(() => {
      expect(screen.getByText(/URL p[uú]blica guardada: https:\/\/pedido-ebs-web\.vercel\.app/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Enviar por WhatsApp' })[0]);

    expect(window.open).toHaveBeenCalledTimes(1);

    const whatsappUrl = window.open.mock.calls[0][0];
    expect(whatsappUrl).toContain('https://wa.me/573222466661?text=');
    expect(whatsappUrl).not.toContain('%250A');

    const encodedText = whatsappUrl.split('?text=')[1];
    const decodedText = decodeURIComponent(encodedText);

    expect(decodedText).toContain('Hola CRISTINA DROGUERIA ARLET,');
    expect(decodedText).toContain('https://pedido-ebs-web.vercel.app');
    expect(decodedText).not.toContain('/catalogo-clientes');
  });

  test('copia el link general luego de configurar URL publica', async () => {
    render(<CampanaCatalogo />);

    await waitFor(() => {
      expect(screen.getByText('CRISTINA DROGUERIA ARLET')).toBeInTheDocument();
    });

    const inputUrl = screen.getByPlaceholderText('https://tu-dominio.com');
    fireEvent.change(inputUrl, { target: { value: 'https://pedido-ebs-web.vercel.app' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar URL p[uú]blica/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Copiar link general' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://pedido-ebs-web.vercel.app');
    });
  });

  test('filtra la campaña para mostrar solo droguerías', async () => {
    render(<CampanaCatalogo />);

    await waitFor(() => {
      expect(screen.getByText('TIENDA DEL CENTRO')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Enviar campaña a' }), {
      target: { value: 'droguerias' }
    });

    expect(screen.getByText('CRISTINA DROGUERIA ARLET')).toBeInTheDocument();
    expect(screen.queryByText('TIENDA DEL CENTRO')).not.toBeInTheDocument();
    const totalCard = screen.getByText('Total evaluados').closest('.stat-card');
    expect(totalCard).not.toBeNull();
    expect(within(totalCard).getByText('1')).toBeInTheDocument();
  });

  test('permite seleccionar un centro comercial específico', async () => {
    render(<CampanaCatalogo />);

    await waitFor(() => {
      expect(screen.getByText('CRISTINA DROGUERIA ARLET')).toBeInTheDocument();
    });

    const selector = screen.getByRole('combobox', { name: 'Enviar campaña a' });
    expect(screen.getByRole('option', { name: 'Solo CC ferrocarril' })).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: 'centro:cc ferrocarril' } });

    expect(screen.getByText('TIENDA DEL CENTRO')).toBeInTheDocument();
    expect(screen.queryByText('CRISTINA DROGUERIA ARLET')).not.toBeInTheDocument();
  });
});