import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import JuegosEBS from '../JuegosEBS';

const mockProducts = [
  { id: 1, nombre: 'Mango', categoria: 'Frutas', imagen_url: '' },
  { id: 2, nombre: 'Manzana', categoria: 'Frutas', imagen_url: '' },
  { id: 3, nombre: 'Banano', categoria: 'Frutas', imagen_url: '' },
  { id: 4, nombre: 'Naranja', categoria: 'Frutas', imagen_url: '' },
  { id: 5, nombre: 'Pera', categoria: 'Frutas', imagen_url: '' },
  { id: 6, nombre: 'Papaya', categoria: 'Frutas', imagen_url: '' },
  { id: 7, nombre: 'Piña', categoria: 'Frutas', imagen_url: '' },
  { id: 8, nombre: 'Uva', categoria: 'Frutas', imagen_url: '' },
  { id: 9, nombre: 'Melón', categoria: 'Frutas', imagen_url: '' },
];

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn(() => Promise.resolve({ data: mockProducts, error: null })),
    })),
  },
}));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('JuegosEBS', () => {
  test('muestra los cinco juegos disponibles', async () => {
    render(<JuegosEBS />);

    expect(await screen.findByRole('heading', { name: 'Juegos EBS' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Memoria de productos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sudoku' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Palabra del día' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Triqui' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Puzzle deslizante' })).toBeInTheDocument();
  });

  test('permite iniciar una partida de memoria', async () => {
    render(<JuegosEBS />);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Jugar' }))[0]);

    expect(screen.getByRole('heading', { name: 'Memoria de productos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar juego' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar juego' }));
    expect(screen.getAllByRole('button', { name: 'Tarjeta oculta' })).toHaveLength(18);
  });

  test('permite jugar Sudoku y reiniciar el tablero', async () => {
    render(<JuegosEBS />);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Jugar' }))[1]);
    expect(screen.getByRole('heading', { name: 'Sudoku' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: /fila \d+, columna \d+/i })).toHaveLength(81);

    const editableCell = screen.getByRole('textbox', { name: 'Fila 1, columna 3' });
    fireEvent.change(editableCell, { target: { value: '4' } });
    expect(editableCell).toHaveValue('4');

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(editableCell).toHaveValue('');
  });

  test('cambia a una palabra nueva de otra longitud cuando se descubre', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.useFakeTimers();
    render(<JuegosEBS />);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Jugar' }))[2]);

    const firstWordInput = screen.getByLabelText('Tu palabra de 4 letras');
    expect(firstWordInput).toHaveAttribute('maxLength', '4');
    fireEvent.change(firstWordInput, { target: { value: 'PERA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Probar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Descubriste la palabra');
    expect(firstWordInput).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1800);
    });

    const nextWordInput = screen.getByLabelText('Tu palabra de 5 letras');
    expect(nextWordInput).toHaveAttribute('maxLength', '5');
    expect(screen.getByText('Intentos: 0/6')).toBeInTheDocument();
  });

  test('permite jugar triqui, anuncia ganador y reinicia la partida', async () => {
    render(<JuegosEBS />);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Jugar' }))[3]);

    const cells = Array.from({ length: 9 }, (_, index) => (
      screen.getByRole('gridcell', { name: `Casilla ${index + 1}, vacía` })
    ));
    fireEvent.click(cells[0]);
    fireEvent.click(cells[3]);
    fireEvent.click(cells[1]);
    fireEvent.click(cells[4]);
    fireEvent.click(cells[2]);

    expect(screen.getByRole('status')).toHaveTextContent('¡Ganó el jugador X!');
    expect(screen.getByRole('gridcell', { name: 'Casilla 3, X' })).toHaveTextContent('X');

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Turno del jugador X');
    expect(screen.getByRole('gridcell', { name: 'Casilla 1, vacía' })).toBeEmptyDOMElement();
  });

  test('permite mover una ficha adyacente en el puzzle deslizante', async () => {
    render(<JuegosEBS />);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Jugar' }))[4]);

    const puzzle = screen.getByRole('grid', { name: 'Puzzle deslizante 4 por 4' });
    const cells = Array.from(puzzle.querySelectorAll('[role="gridcell"]'));
    const emptyIndex = cells.findIndex((cell) => cell.getAttribute('aria-label') === 'Espacio vacío');
    const emptyRow = Math.floor(emptyIndex / 4);
    const adjacentIndex = emptyRow > 0 ? emptyIndex - 4 : emptyIndex + 4;
    const movedTile = cells[adjacentIndex].getAttribute('aria-label');

    fireEvent.click(cells[adjacentIndex]);

    expect(screen.getByText('Movimientos:')).toHaveTextContent('Movimientos: 1');
    expect(screen.getByRole('gridcell', { name: 'Espacio vacío' })).toBeInTheDocument();
    const updatedCells = Array.from(puzzle.querySelectorAll('[role="gridcell"]'));
    expect(updatedCells[adjacentIndex]).toHaveAttribute('aria-label', 'Espacio vacío');
    expect(screen.getByRole('gridcell', { name: movedTile })).toHaveTextContent(movedTile.match(/\d+/)[0]);
  });
});
