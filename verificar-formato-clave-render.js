const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

console.log('\n=== VERIFICACIÓN DE FORMATO DE CLAVE FIREBASE ===\n');

// Obtener la clave privada del .env local
const localPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!localPrivateKey) {
    console.error('❌ No se encontró FIREBASE_PRIVATE_KEY en .env local');
    process.exit(1);
}

console.log('✅ CLAVE LOCAL ENCONTRADA');
console.log('Longitud:', localPrivateKey.length);
console.log('Comienza con:', localPrivateKey.substring(0, 50) + '...');
console.log('Termina con:', '...' + localPrivateKey.substring(localPrivateKey.length - 50));

// Verificar que la clave tenga el formato correcto
const isValidFormat = localPrivateKey.includes('-----BEGIN PRIVATE KEY-----') && 
                     localPrivateKey.includes('-----END PRIVATE KEY-----');

console.log('\n=== ANÁLISIS DE FORMATO ===');
console.log('✅ Contiene BEGIN PRIVATE KEY:', localPrivateKey.includes('-----BEGIN PRIVATE KEY-----'));
console.log('✅ Contiene END PRIVATE KEY:', localPrivateKey.includes('-----END PRIVATE KEY-----'));
console.log('✅ Contiene \\n (saltos de línea):', localPrivateKey.includes('\\n'));

// Mostrar cómo debería verse en Render (sin comillas externas)
console.log('\n=== FORMATO PARA RENDER ===');
console.log('La clave en Render debe ser EXACTAMENTE (sin comillas externas):');
console.log('');
console.log('FIREBASE_PRIVATE_KEY=' + localPrivateKey);
console.log('');

// Verificar si hay caracteres especiales que podrían causar problemas
console.log('=== VERIFICACIÓN DE CARACTERES ESPECIALES ===');
console.log('Contiene comillas dobles internas:', localPrivateKey.includes('"'));
console.log('Contiene comillas simples:', localPrivateKey.includes("'"));
console.log('Contiene espacios:', localPrivateKey.includes(' '));

// Crear la versión exacta para copiar a Render
const renderFormat = localPrivateKey;
console.log('\n=== VERSIÓN PARA COPIAR A RENDER ===');
console.log('Nombre de variable: FIREBASE_PRIVATE_KEY');
console.log('Valor (copiar todo después del =):');
console.log(renderFormat);

console.log('\n=== INSTRUCCIONES PARA RENDER ===');
console.log('1. Ve a tu dashboard de Render');
console.log('2. Busca la variable FIREBASE_PRIVATE_KEY');
console.log('3. ELIMINA la "n" extra del inicio si existe');
console.log('4. Asegúrate de que el valor sea exactamente:');
console.log('   ' + renderFormat);
console.log('5. NO agregues comillas externas en Render');
console.log('6. Guarda y redespliega');
