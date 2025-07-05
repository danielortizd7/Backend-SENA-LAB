require('dotenv').config();

console.log('🔧 GENERADOR DE FORMATO DE CLAVE PARA RENDER');
console.log('===========================================');

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!privateKey) {
    console.log('❌ ERROR: FIREBASE_PRIVATE_KEY no está definida');
    process.exit(1);
}

console.log('✅ Clave privada cargada desde .env');

// Limpiar la clave (eliminar líneas vacías al final)
const cleanedKey = privateKey.trim();

console.log('\nINFORMACIÓN DE LA CLAVE:');
console.log('Longitud original:', privateKey.length);
console.log('Longitud después de limpiar:', cleanedKey.length);

// Verificar formato
const lines = cleanedKey.split('\n');
console.log('Número de líneas:', lines.length);

// Mostrar la clave en el formato exacto para Render
console.log('\n' + '='.repeat(60));
console.log('FORMATO PARA RENDER (copiar exactamente):');
console.log('='.repeat(60));
console.log('VARIABLE: FIREBASE_PRIVATE_KEY');
console.log('VALOR (SIN COMILLAS):');
console.log('='.repeat(60));
console.log(cleanedKey);
console.log('='.repeat(60));

// También mostrar cómo se vería escapado para verificación
console.log('\nFORMATO ESCAPADO PARA VERIFICACIÓN:');
console.log('='.repeat(60));
console.log(JSON.stringify(cleanedKey));
console.log('='.repeat(60));

// Verificaciones finales
console.log('\nVERIFICACIONES FINALES:');
console.log('- Comienza con -----BEGIN PRIVATE KEY-----:', cleanedKey.startsWith('-----BEGIN PRIVATE KEY-----'));
console.log('- Termina con -----END PRIVATE KEY-----:', cleanedKey.endsWith('-----END PRIVATE KEY-----'));
console.log('- Contiene saltos de línea:', cleanedKey.includes('\n'));
console.log('- Número de saltos de línea:', (cleanedKey.match(/\n/g) || []).length);

console.log('\nINSTRUCCIONES PARA RENDER:');
console.log('1. Ve a tu dashboard de Render');
console.log('2. Selecciona tu servicio Backend-SENA-LAB');
console.log('3. Ve a Environment > Environment Variables');
console.log('4. Busca FIREBASE_PRIVATE_KEY');
console.log('5. Edita el valor');
console.log('6. Copia y pega EXACTAMENTE el texto de arriba (SIN COMILLAS)');
console.log('7. Guarda los cambios');
console.log('8. Redespliega el servicio');
