// Script para consultar el centro comercial de un cliente por su código_cliente en Supabase
// Uso: node consultaCentroComercial.js <codigo_cliente>

const { createClient } = require('@supabase/supabase-js');

// Configura tus credenciales de Supabase aquí
const SUPABASE_URL = 'TU_SUPABASE_URL'; // <-- Pega aquí tu URL de Supabase
const SUPABASE_KEY = 'TU_SUPABASE_KEY'; // <-- Pega aquí tu API Key de Supabase

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const codigo = process.argv[2];
  if (!codigo) {
    console.error('Debes proporcionar el código_cliente como argumento.');
    process.exit(1);
  }

  const { data, error } = await supabase
    .from('clientes')
    .select('codigo_cliente, nombre, centro_comercial')
    .eq('codigo_cliente', codigo)
    .single();

  if (error) {
    console.error('Error en la consulta:', error.message);
    process.exit(1);
  }

  if (!data) {
    console.log('No se encontró ningún cliente con ese código_cliente.');
    process.exit(0);
  }

  console.log('Cliente encontrado:');
  console.log('Código Cliente:', data.codigo_cliente);
  console.log('Nombre:', data.nombre);
  console.log('Centro Comercial:', data.centro_comercial || 'No asignado');
}

main();
