const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 VERIFICANDO CONFIGURACIÓN FIREBASE PARA RENDER\n');

// Leer la clave privada del .env local
const localPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!localPrivateKey) {
    console.log('❌ No se encontró FIREBASE_PRIVATE_KEY en .env local');
    process.exit(1);
}

console.log('✅ FIREBASE_PRIVATE_KEY encontrada en .env local');
console.log('📏 Longitud:', localPrivateKey.length, 'caracteres');
console.log('🔢 Número de \\n:', (localPrivateKey.match(/\\n/g) || []).length);

console.log('\n' + '='.repeat(60));
console.log('📋 VALOR CORRECTO PARA RENDER:');
console.log('='.repeat(60));

console.log('\n🏷️  NOMBRE DE LA VARIABLE:');
console.log('FIREBASE_PRIVATE_KEY');

console.log('\n📝 VALOR EXACTO (copiar y pegar en Render):');
console.log('----------------------------------------');
console.log(localPrivateKey);
console.log('----------------------------------------');

console.log('\n⚠️  INSTRUCCIONES PARA RENDER:');
console.log('1. Ve a tu dashboard de Render');
console.log('2. Selecciona tu servicio');
console.log('3. Ve a Environment');
console.log('4. ELIMINA la variable "nFIREBASE_PRIVATE_KEY"');
console.log('5. AGREGA una nueva variable con nombre: FIREBASE_PRIVATE_KEY');
console.log('6. COPIA Y PEGA el valor exacto mostrado arriba');
console.log('7. GUARDA y redespliega');

console.log('\n🔍 VERIFICACIÓN:');
console.log('- Debe comenzar con: "-----BEGIN PRIVATE KEY-----\\n');
console.log('- Debe terminar con: \\n-----END PRIVATE KEY-----\\n"');
console.log('- NO debe tener comillas externas en Render');
console.log('- El nombre debe ser exactamente: FIREBASE_PRIVATE_KEY');

// Verificar que el formato es correcto
if (localPrivateKey.startsWith('"') && localPrivateKey.endsWith('"')) {
    console.log('\n⚠️  IMPORTANTE: En Render NO pongas las comillas externas');
    console.log('En tu .env local tienes comillas, pero en Render debes poner SOLO el contenido SIN comillas');
    
    const withoutQuotes = localPrivateKey.slice(1, -1);
    console.log('\n📝 VALOR SIN COMILLAS PARA RENDER:');
    console.log('----------------------------------------');
    console.log(withoutQuotes);
    console.log('----------------------------------------');
}

console.log('\n🚀 Después de actualizar, redespliega y prueba con:');
console.log('curl https://tu-backend-url.onrender.com/api/diagnostic/firebase');
