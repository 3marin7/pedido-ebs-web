const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const { spawnSync } = require('child_process');

function cargarEnvDesdeArchivo(rutaEnv) {
  if (!fs.existsSync(rutaEnv)) return;

  const contenido = fs.readFileSync(rutaEnv, 'utf8');
  const lineas = contenido.split(/\r?\n/);

  for (const linea of lineas) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;

    const separador = limpia.indexOf('=');
    if (separador <= 0) continue;

    const clave = limpia.slice(0, separador).trim();
    let valor = limpia.slice(separador + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }

    if (typeof process.env[clave] === 'undefined') {
      process.env[clave] = valor;
    }
  }
}

const archivosEnv = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local')
];

for (const archivoEnv of archivosEnv) {
  cargarEnvDesdeArchivo(archivoEnv);
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const TABLAS = (process.env.BACKUP_TABLES || 'abonos,clientes,facturas,pedidos,productos')
  .split(',')
  .map((tabla) => tabla.trim())
  .filter(Boolean);
const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || '1000', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno para Supabase (URL y KEY).');
  console.error('Usa SUPABASE_URL + SUPABASE_KEY (o VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).');
  console.error('También puedes definirlas en backups/supabase-backups/.env');
  process.exit(1);
}

if (SUPABASE_URL.includes('tu-proyecto.supabase.co') || SUPABASE_KEY.includes('tu_supabase_key_segura')) {
  console.error('❌ Estás usando valores de ejemplo en backups/supabase-backups/.env');
  console.error('Reemplaza SUPABASE_URL y SUPABASE_KEY por valores reales de tu proyecto Supabase.');
  process.exit(1);
}

if (!Array.isArray(TABLAS) || TABLAS.length === 0) {
  console.error('❌ No hay tablas para respaldar. Define BACKUP_TABLES="tabla1,tabla2"');
  process.exit(1);
}

if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE <= 0) {
  console.error('❌ BATCH_SIZE inválido. Usa un entero mayor que 0.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchCount(tabla) {
  const { count, error } = await supabase.from(tabla).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

async function fetchBatch(tabla, desde, hasta) {
  const { data, error } = await supabase.from(tabla).select('*').range(desde, hasta);
  if (error) throw error;
  return data || [];
}

function esperarFinStream(stream) {
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function hacerBackupCompleto() {
  console.log('🔄 Iniciando proceso de backup...');
  console.log('📋 Tablas a respaldar:', TABLAS.join(', '));

  const ahora = new Date();
  const fecha = ahora.toISOString().split('T')[0];
  const hora = ahora.toTimeString().split(' ')[0].replace(/:/g, '-');
  const carpetaBackup = `backup_${fecha}_${hora}`;
  const rutaBackup = path.join(process.cwd(), carpetaBackup);

  if (!fs.existsSync(rutaBackup)) {
    fs.mkdirSync(rutaBackup, { recursive: true });
  }

  const resumen = {
    fecha: new Date().toISOString(),
    proyecto: SUPABASE_URL,
    tablas: []
  };

  let tablasProcesadas = 0;
  let totalRegistros = 0;

  for (const tabla of TABLAS) {
    try {
      console.log(`\n⬇️  Procesando tabla: ${tabla}`);
      const expected = await fetchCount(tabla);
      console.log(`   Conteo esperado: ${expected}`);

      if (expected === 0) {
        console.log(`   ⚠️  ${tabla}: sin registros`);
        resumen.tablas.push({ tabla, expected, downloaded: 0, status: 'EMPTY' });
        continue;
      }

      const jsonFilePath = path.join(rutaBackup, `${tabla}.json`);
      const csvFilePath = path.join(rutaBackup, `${tabla}.csv`);

      if (expected <= 5000) {
        let all = [];
        for (let offset = 0; offset < expected; offset += BATCH_SIZE) {
          const batch = await fetchBatch(tabla, offset, offset + BATCH_SIZE - 1);
          all = all.concat(batch);
        }

        fs.writeFileSync(jsonFilePath, JSON.stringify(all, null, 2));

        try {
          if (all.length > 0) {
            const parser = new Parser({ fields: Object.keys(all[0]) });
            fs.writeFileSync(csvFilePath, parser.parse(all));
          }
        } catch (errorCsv) {
          console.warn(`   ⚠️  No se pudo generar CSV para ${tabla}: ${errorCsv.message}`);
        }

        console.log(`   ✅ ${tabla}: ${all.length} registros (JSON${all.length > 0 ? ' + CSV' : ''})`);
        resumen.tablas.push({
          tabla,
          expected,
          downloaded: all.length,
          status: expected === all.length ? 'OK' : 'MISMATCH'
        });
        totalRegistros += all.length;
        tablasProcesadas++;
        continue;
      }

      const stream = fs.createWriteStream(jsonFilePath, { encoding: 'utf8' });
      stream.write('[');

      let firstItem = true;
      let downloaded = 0;

      for (let offset = 0; offset < expected; offset += BATCH_SIZE) {
        const batch = await fetchBatch(tabla, offset, offset + BATCH_SIZE - 1);
        for (const row of batch) {
          if (!firstItem) stream.write(',\n');
          stream.write(JSON.stringify(row));
          firstItem = false;
          downloaded++;
        }
        console.log(`   descargados: ${downloaded}/${expected}`);
      }

      stream.write(']');
      stream.end();
      await esperarFinStream(stream);

      console.log(`   ✅ ${tabla}: ${downloaded} registros (JSON streaming)`);
      resumen.tablas.push({
        tabla,
        expected,
        downloaded,
        status: expected === downloaded ? 'OK' : 'MISMATCH'
      });
      totalRegistros += downloaded;
      tablasProcesadas++;
    } catch (error) {
      console.error(`   💥 Error en tabla ${tabla}: ${error.message}`);
      resumen.tablas.push({
        tabla,
        expected: null,
        downloaded: 0,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  resumen.tablas_procesadas = tablasProcesadas;
  resumen.tablas_totales = TABLAS.length;
  resumen.total_registros = totalRegistros;
  resumen.estado = resumen.tablas.some((tabla) => !['OK', 'EMPTY'].includes(tabla.status))
    ? 'INCOMPLETE'
    : 'COMPLETADO';

  fs.writeFileSync(path.join(rutaBackup, '_RESUMEN_BACKUP.json'), JSON.stringify(resumen, null, 2));

  const zipName = `${carpetaBackup}.zip`;
  try {
    console.log('📦 Comprimiendo backup en', zipName);
    const zipResult = spawnSync('zip', ['-r', zipName, carpetaBackup], { cwd: process.cwd(), stdio: 'ignore' });
    if (zipResult.status === 0) {
      console.log('   ✅ Comprimido:', zipName);
    } else {
      console.warn('   ⚠️  No se pudo comprimir (zip no disponible o error del comando)');
    }
  } catch (zipError) {
    console.warn('   ⚠️  No se pudo comprimir:', zipError.message);
  }

  if (resumen.estado === 'COMPLETADO') {
    console.log('\n🎉 BACKUP FINALIZADO');
    console.log(`📂 Carpeta: ${carpetaBackup}/`);
    console.log(`📊 Tablas procesadas: ${tablasProcesadas}/${TABLAS.length}`);
    console.log(`📈 Total de registros: ${totalRegistros}`);
    console.log(`📄 Resumen: ${carpetaBackup}/_RESUMEN_BACKUP.json`);
    console.log('💾 Formato principal: JSON (CSV para tablas pequeñas)');
    return;
  }

  console.error('\n❌ BACKUP INCOMPLETO');
  console.error(`📂 Carpeta: ${carpetaBackup}/`);
  console.error(`📊 Tablas procesadas: ${tablasProcesadas}/${TABLAS.length}`);
  console.error(`📈 Total de registros: ${totalRegistros}`);
  console.error(`📄 Revisa: ${carpetaBackup}/_RESUMEN_BACKUP.json`);
  process.exitCode = 1;
}

hacerBackupCompleto().catch((error) => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});