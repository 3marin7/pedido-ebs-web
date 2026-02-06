// src/components/__tests__/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../Button'

describe('Button Component', () => {
  
  // ============================================
  // TESTS DE RENDERIZADO
  // ============================================
  test('renderiza correctamente con texto', () => {
    render(<Button>Click Me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click Me')
  })
  
  test('renderiza con children diferentes', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByText('Guardar')).toBeInTheDocument()
    
    render(<Button>Cancelar</Button>)
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })
  
  // ============================================
  // TESTS DE INTERACCIÓN
  // ============================================
  test('llama onClick cuando se hace click', () => {
    const handleClick = jest.fn() // Mock function
    render(<Button onClick={handleClick}>Click</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  test('llama onClick múltiples veces', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(3)
  })
  
  test('no llama onClick cuando está disabled', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })
  
  // ============================================
  // TESTS DE PROPIEDADES
  // ============================================
  test('se deshabilita cuando disabled es true', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
  
  test('está habilitado por defecto', () => {
    render(<Button>Enabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })
  
  test('aplica el tipo button por defecto', () => {
    render(<Button>Default Type</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'button')
  })
  
  test('aplica el tipo submit cuando se especifica', () => {
    render(<Button type="submit">Submit</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })
  
  // ============================================
  // TESTS DE VARIANTES
  // ============================================
  test('aplica clases de variante primary por defecto', () => {
    render(<Button>Primary</Button>)
    
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-blue-500')
  })
  
  test('aplica clases de variante secondary', () => {
    render(<Button variant="secondary">Secondary</Button>)
    
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-gray-200')
  })
  
  test('aplica clases de variante danger', () => {
    render(<Button variant="danger">Danger</Button>)
    
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-red-500')
  })
  
  // ============================================
  // TESTS DE CLASES CSS
  // ============================================
  test('siempre aplica clases base', () => {
    render(<Button>Base Classes</Button>)
    
    const button = screen.getByRole('button')
    expect(button.className).toContain('px-4')
    expect(button.className).toContain('py-2')
    expect(button.className).toContain('rounded')
  })
  
  // ============================================
  // TESTS DE ACCESIBILIDAD
  // ============================================
  test('es accesible como botón', () => {
    render(<Button>Accessible Button</Button>)
    
    // Debe tener role button (implícito)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
  
  test('mantiene accesibilidad cuando está disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('disabled')
  })
  
  // ============================================
  // TESTS DE CASOS ESPECIALES
  // ============================================
  test('renderiza con children complejos (JSX)', () => {
    render(
      <Button>
        <span>Icon</span> Text
      </Button>
    )
    
    expect(screen.getByText('Icon')).toBeInTheDocument()
    expect(screen.getByText(/text/i)).toBeInTheDocument()
  })
  
  test('no rompe si onClick es undefined', () => {
    render(<Button>No Handler</Button>)
    
    const button = screen.getByRole('button')
    
    // No debe lanzar error al hacer click
    expect(() => fireEvent.click(button)).not.toThrow()
  })
})
