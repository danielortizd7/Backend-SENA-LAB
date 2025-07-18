const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class CredencialesEmailService {
  constructor() {
    this.validateEnvironmentVariables();
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }

  validateEnvironmentVariables() {
    const requiredVars = [
      'EMAIL_HOST',
      'EMAIL_PORT',
      'EMAIL_SECURE',
      'EMAIL_USER',
      'EMAIL_FROM'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Faltan variables de entorno para CredencialesEmailService: ${missingVars.join(', ')}`);
    }
  }

  async enviarCredenciales(destinatario, nombre, password, tipoUsuario) {
    let qrPath = null;
    
    try {
      let attachments = [];
      let qrHtml = '';
      
      // ✅ ENLACE DE DESCARGA ACTUALIZADO CON MEGA
      const enlaceDescarga = "https://mega.nz/file/5RIUwDzS#r7oiNtoL_s5qHRSSx3zx9XQEfA9YA9SSACFwxE7tghA";

      if (tipoUsuario.toLowerCase() === 'cliente') {
        // Crear directorio temporal si no existe
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generar QR como archivo temporal
        qrPath = path.join(tempDir, `qr_${Date.now()}.png`);
        await QRCode.toFile(qrPath, enlaceDescarga);

        // Configurar attachment
        attachments.push({
          filename: 'qr-app.png',
          path: qrPath,
          cid: 'qrcode'
        });

        qrHtml = `
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 16px; color: #333;">📱 <strong>Descarga la App Móvil de Aqualab</strong></p>
            <p>Escanea este código QR con tu teléfono:</p>
            <img src="cid:qrcode" alt="QR de descarga para la app móvil de Aqualab" 
                 style="width:200px;height:200px;display:block;margin:20px auto;border:2px solid #007bff;border-radius:10px;" />
            <p>O descarga directamente desde:</p>
            <a href="${enlaceDescarga}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               📥 Descargar App para Android
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Enlace alojado en Mega.nz - Descarga segura y confiable
            </p>
          </div>
        `;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">🚰 Bienvenido/a a Aqualab</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
            <p>Se ha creado una cuenta para ti como <strong>${tipoUsuario}</strong> en el sistema de Aqualab.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">🔑 Credenciales de Acceso</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>📧 Email:</strong> ${destinatario}</li>
                <li style="margin: 10px 0;"><strong>🔒 Contraseña:</strong> ${password}</li>
              </ul>
            </div>
            
            ${qrHtml}
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ⚠️ <strong>Importante:</strong> Te recomendamos cambiar tu contraseña tras el primer inicio de sesión por seguridad.
              </p>
            </div>
            
            <p style="margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>Equipo Aqualab</strong> 💧
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: destinatario,
        subject: '🚰 Tus credenciales de acceso a Aqualab',
        html,
        attachments
      });

      console.log(`✅ Correo de credenciales enviado a ${destinatario}`);
      
    } catch (error) {
      console.error('❌ Error al enviar email de credenciales:', error);
      throw error;
    } finally {
      // Limpiar archivo temporal
      if (qrPath && fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }
  }
}

module.exports = CredencialesEmailService;