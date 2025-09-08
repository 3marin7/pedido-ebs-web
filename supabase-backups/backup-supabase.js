const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { Parser } = require('json2csv');

// 🔽 🔽 🔽 REEMPLAZA ESTOS DATOS CON TUS CREDENCIALES 🔽 🔽 🔽


//const supabaseUrl = 'https://jqkfykverasqwlfsjsnj.supabase.co';
//const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2Z5a3ZlcmFzcXdsZnNqc25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU2ODEsImV4cCI6MjA3MDM0MTY4MX0.5Ep9I5N7bEYXj7OdsdiYacR-GM8X586Zv8KsDycLS70';




const SUPABASE_URL = 'https://jqkfykverasqwlfsjsnj.supabase.co';  // ← Tu URL aquí
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2Z5a3ZlcmFzcXdsZnNqc25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU2ODEsImV4cCI6MjA3MDM0MTY4MX0.5Ep9I5N7bEYXj7OdsdiYacR-GM8X586Zv8KsDycLS70';              // ← Tu API Key aquí
// 🔼 🔼 🔼 REEMPLAZA CON TUS DATOS REALES 🔼 🔼 🔼

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 📋 LISTA DE TUS TABLAS (verifica que los nombres sean exactos)
const TABLAS = ['abonos', 'clientes', 'facturas', 'pedidos', 'productos'];

async function hacerBackupCompleto() {
  console.log('🔄 Iniciando proceso de backup...');
  console.log('📋 Tablas a respaldar:', TABLAS.join(', '));

  // 📂 Crear carpeta con fecha y hora
  const ahora = new Date();
  const fecha = ahora.toISOString().split('T')[0];
  const hora = ahora.toTimeString().split(' ')[0].replace(/:/g, '-');
  const carpetaBackup = `backup_${fecha}_${hora}`;
  
  if (!fs.existsSync(carpetaBackup)) {
    fs.mkdirSync(carpetaBackup);
    console.log(`📂 Carpeta creada: ${carpetaBackup}`);
  }

  let totalRegistros = 0;
  let tablasProcesadas = 0;

  // 🔄 Recorrer cada tabla y hacer backup
  for (const tabla of TABLAS) {
    try {
      console.log(`\n⬇️  Descargando: ${tabla}...`);
      
      // 📤 Descargar TODOS los datos de la tabla
      const { data, error } = await supabase
        .from(tabla)
        .select('*');

      if (error) {
        console.error(`❌ Error en ${tabla}:`, error.message);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`⚠️  ${tabla}: No hay datos`);
        continue;
      }

      // 💾 Guardar como JSON
      const jsonFilePath = `${carpetaBackup}/${tabla}.json`;
      fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));

      // 💾 Guardar como CSV (opcional)
      try {
        const parser = new Parser();
        const csv = parser.parse(data);
        const csvFilePath = `${carpetaBackup}/${tabla}.csv`;
        fs.writeFileSync(csvFilePath, csv);
        console.log(`✅ ${tabla}: ${data.length} registros (JSON + CSV)`);
      } catch (csvError) {
        console.log(`✅ ${tabla}: ${data.length} registros (solo JSON)`);
      }

      totalRegistros += data.length;
      tablasProcesadas++;

    } catch (error) {
      console.error(`💥 Error grave en ${tabla}:`, error.message);
    }
  }

  // 📊 Crear archivo de resumen
  const resumen = {
    fecha: new Date().toISOString(),
    proyecto: SUPABASE_URL,
    tablas_procesadas: tablasProcesadas,
    tablas_totales: TABLAS.length,
    total_registros: totalRegistros,
    estado: 'COMPLETADO'
  };
  
  fs.writeFileSync(
    `${carpetaBackup}/_RESUMEN_BACKUP.json`,
    JSON.stringify(resumen, null, 2)
  );

  console.log('\n🎉 ¡BACKUP COMPLETADO EXITOSAMENTE!');
  console.log(`📂 Carpeta: ${carpetaBackup}/`);
  console.log(`📊 Tablas procesadas: ${tablasProcesadas}/${TABLAS.length}`);
  console.log(`📈 Total de registros: ${totalRegistros}`);
  console.log('💾 Formatos: JSON y CSV');
}

// 🏃 Ejecutar el backup
hacerBackupCompleto().catch(error => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
