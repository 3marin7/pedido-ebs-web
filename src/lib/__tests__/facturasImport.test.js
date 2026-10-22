import * as XLSX from 'xlsx';
import { describe, expect, test } from '@jest/globals';
import { parsearArchivoFacturas } from '../facturasImport';

const factura = {
  id: 15,
  cliente: 'Cliente de prueba',
  vendedor: 'Vendedor',
  fecha: '2026-01-15',
  productos: [{ nombre: 'Producto', cantidad: 2 }],
  total: 5000,
};

const crearArchivo = (name, contenido) => ({
  name,
  text: async () => contenido,
  arrayBuffer: async () => Uint8Array.from(
    Array.from(contenido, (character) => character.charCodeAt(0))
  ).buffer,
});

describe('parsearArchivoFacturas', () => {
  test('mantiene compatibilidad con el respaldo JSON', async () => {
    const resultado = await parsearArchivoFacturas(crearArchivo(
      'respaldo.json',
      JSON.stringify({ facturas: [factura], abonos: [] })
    ));

    expect(resultado.facturas).toEqual([factura]);
    expect(resultado.abonos).toEqual([]);
  });

  test('lee hojas Facturas y Abonos de un archivo Excel', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ ...factura, productos: JSON.stringify(factura.productos) }]),
      'Facturas'
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ id: 2, factura_id: 15, fecha: '2026-01-16', monto: 200 }]),
      'Abonos'
    );
    const contenido = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = { name: 'respaldo.xlsx', arrayBuffer: async () => contenido };

    const resultado = await parsearArchivoFacturas(file);

    expect(resultado.facturas[0]).toEqual(factura);
    expect(resultado.abonos).toEqual([{
      metodo: 'No especificado',
      id: 2,
      factura_id: 15,
      fecha: '2026-01-16',
      monto: 200,
    }]);
  });

  test('lee CSV dividido en secciones y permite productos JSON', async () => {
    const csv = [
      'FACTURAS',
      'id,cliente,vendedor,fecha,productos,total',
      `15,"Cliente de prueba",Vendedor,2026-01-15,"${JSON.stringify(factura.productos).replaceAll('"', '""')}",5000`,
      '',
      'ABONOS',
      'id,factura_id,fecha,monto',
      '2,15,2026-01-16,200',
    ].join('\n');
    const resultado = await parsearArchivoFacturas(crearArchivo('respaldo.csv', csv));

    expect(resultado.facturas[0]).toEqual(factura);
    expect(resultado.abonos[0]).toMatchObject({ id: 2, factura_id: 15, monto: 200 });
  });

  test('rechaza CSV de facturas que no contiene los productos necesarios', async () => {
    const csv = 'FACTURAS\nid,cliente,vendedor,fecha,total\n15,Cliente,Vendedor,2026-01-15,5000';

    await expect(parsearArchivoFacturas(crearArchivo('incompleto.csv', csv)))
      .rejects.toThrow('productos');
  });
});
