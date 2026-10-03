import { findMatchingProduct } from '../InvoiceScreen';

describe('InvoiceScreen - matching de productos', () => {
  test('no debe mezclar productos con nombres similares', () => {
    const catalogo = [
      { id: 18, nombre: 'HUGGIES ETAPA 3 52 PANALES', codigo: 'H3-52', stock: 78 },
      { id: 32, nombre: 'HUGGIES ETAPA 5 X 52', codigo: 'H5-52', stock: 0 },
    ];

    expect(findMatchingProduct(catalogo, 'HUGGIES ETAPA 3 52 PANALES').id).toBe(18);
    expect(findMatchingProduct(catalogo, 'HUGGIES ETAPA 5 X 52').id).toBe(32);
  });

  test('debe preferir la coincidencia exacta por nombre y usar código solo como respaldo', () => {
    const catalogo = [
      { id: 18, nombre: 'HUGGIES ETAPA 3 52 PANALES', codigo: 'H3-52', stock: 78 },
      { id: 32, nombre: 'HUGGIES ETAPA 5 X 52', codigo: 'H5-52', stock: 0 },
    ];

    expect(findMatchingProduct(catalogo, 'HUGGIES ETAPA 3 52 PANALES', 'H5-52').id).toBe(18);
    expect(findMatchingProduct(catalogo, 'HUGGIES ETAPA 5 X 52', 'H5-52').id).toBe(32);
  });
});
