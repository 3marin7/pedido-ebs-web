import * as XLSX from 'xlsx';

const CAMPOS_FACTURA = ['id', 'cliente', 'vendedor', 'fecha', 'productos', 'total'];
const CAMPOS_ABONO = ['id', 'factura_id', 'fecha', 'monto'];

const normalizarEncabezado = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const normalizarRegistro = (record) =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => {
    const encabezado = normalizarEncabezado(key);
    const valor = value instanceof Date
      ? (encabezado === 'fecha' ? value.toISOString().slice(0, 10) : value.toISOString())
      : value;

    return [encabezado, valor];
  }));

const validarRegistros = (records, campos, nombre) => {
  if (!Array.isArray(records)) {
    throw new Error(`La sección ${nombre} debe contener una lista de registros.`);
  }

  const ids = new Set();

  return records.map((registro, index) => {
    if (!registro || typeof registro !== 'object' || Array.isArray(registro)) {
      throw new Error(`${nombre}: el registro ${index + 1} no es válido.`);
    }

    const normalizado = normalizarRegistro(registro);
    const faltantes = campos.filter((campo) => (
      !Object.prototype.hasOwnProperty.call(normalizado, campo)
      || normalizado[campo] === null
      || normalizado[campo] === ''
    ));

    if (faltantes.length) {
      throw new Error(
        `${nombre}: el registro ${index + 1} no incluye los campos requeridos: ${faltantes.join(', ')}.`
      );
    }

    const idNormalizado = String(normalizado.id);
    if (ids.has(idNormalizado)) {
      throw new Error(`${nombre}: el ID ${idNormalizado} está repetido en el archivo.`);
    }
    ids.add(idNormalizado);

    const campoNumerico = nombre === 'Facturas' ? 'total' : 'monto';
    const valorNumerico = Number(normalizado[campoNumerico]);
    if (!Number.isFinite(valorNumerico)) {
      throw new Error(`${nombre}: el valor de ${campoNumerico} del registro ${index + 1} no es numérico.`);
    }
    normalizado[campoNumerico] = valorNumerico;

    if (nombre === 'Facturas' && typeof normalizado.productos === 'string') {
      try {
        normalizado.productos = JSON.parse(normalizado.productos);
      } catch {
        throw new Error(
          `Facturas: los productos del registro ${index + 1} no contienen un JSON válido.`
        );
      }
    }

    if (nombre === 'Facturas' && !Array.isArray(normalizado.productos)) {
      throw new Error(`Facturas: los productos del registro ${index + 1} deben ser una lista.`);
    }

    return normalizado;
  });
};

const filasARegistros = (rows) => {
  if (!rows.length) return [];

  const encabezados = rows[0].map(normalizarEncabezado);
  if (!encabezados.some(Boolean)) return [];

  return rows.slice(1)
    .filter((row) => row.some((value) => value !== '' && value !== null && value !== undefined))
    .map((row) => Object.fromEntries(
      encabezados
        .map((header, index) => [header, row[index] ?? ''])
        .filter(([header]) => header)
    ));
};

const parsearCsvPorSecciones = (rows) => {
  const secciones = {};
  let encontroSeccion = false;

  for (let index = 0; index < rows.length; index += 1) {
    const marker = normalizarEncabezado(rows[index]?.[0]);
    if (marker !== 'facturas' && marker !== 'abonos') continue;

    encontroSeccion = true;
    const nombre = marker === 'facturas' ? 'Facturas' : 'Abonos';
    let fin = index + 1;

    while (fin < rows.length) {
      const siguienteMarker = normalizarEncabezado(rows[fin]?.[0]);
      if (siguienteMarker === 'facturas' || siguienteMarker === 'abonos') break;
      fin += 1;
    }

    secciones[nombre] = filasARegistros(rows.slice(index + 1, fin));
    index = fin - 1;
  }

  if (!encontroSeccion) {
    secciones.Facturas = filasARegistros(rows);
  }

  return secciones;
};

const filasDeHoja = (sheet) =>
  XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true })
    .map(normalizarRegistro);

export const parsearArchivoFacturas = async (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let facturas = [];
  let abonos = [];

  if (extension === 'json') {
    let datos;
    try {
      datos = JSON.parse(await file.text());
    } catch {
      throw new Error('El archivo no contiene un JSON válido.');
    }

    if (Array.isArray(datos)) {
      facturas = datos;
    } else if (datos && typeof datos === 'object') {
      facturas = datos.facturas ?? [];
      abonos = datos.abonos ?? [];
    } else {
      throw new Error('El formato JSON no contiene facturas ni abonos.');
    }
  } else if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });

    if (!workbook.SheetNames.length) {
      throw new Error('El archivo no contiene hojas o datos para importar.');
    }

    if (extension === 'csv') {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
        header: 1,
        defval: '',
        blankrows: true,
        raw: true,
      });
      const secciones = parsearCsvPorSecciones(rows);
      facturas = secciones.Facturas ?? [];
      abonos = secciones.Abonos ?? [];
    } else {
      const facturasSheet = workbook.SheetNames.find(
        (sheetName) => normalizarEncabezado(sheetName) === 'facturas'
      );
      const abonosSheet = workbook.SheetNames.find(
        (sheetName) => normalizarEncabezado(sheetName) === 'abonos'
      );
      const hojaFacturas = facturasSheet ?? (!abonosSheet ? workbook.SheetNames[0] : null);

      if (hojaFacturas) facturas = filasDeHoja(workbook.Sheets[hojaFacturas]);
      if (abonosSheet) abonos = filasDeHoja(workbook.Sheets[abonosSheet]);
    }
  } else {
    throw new Error('Formato no compatible. Selecciona un archivo JSON, Excel (.xlsx/.xls) o CSV.');
  }

  facturas = validarRegistros(facturas, CAMPOS_FACTURA, 'Facturas');
  abonos = validarRegistros(abonos, CAMPOS_ABONO, 'Abonos')
    .map((abono) => ({ ...abono, metodo: abono.metodo || 'No especificado' }));

  if (!facturas.length && !abonos.length) {
    throw new Error('El archivo no contiene facturas ni abonos para importar.');
  }

  return { facturas, abonos };
};
