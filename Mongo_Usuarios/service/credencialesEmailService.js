const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

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
    try {
      let qrHtml = '';
      const enlaceDescarga = "https://drive.google.com/file/d/1p831NhFwx-zyOq5VPWt3rGTqj75RpA9E/view?usp=drive_link";

      if (tipoUsuario.toLowerCase() === 'cliente') {
        const qrDataUrl = await QRCode.toDataURL(enlaceDescarga);
        qrHtml = `
          <p>Puedes descargar la app móvil escaneando este código QR:</p>
          <img src="${qrDataUrl}" alt="QR de descarga" style="width:150px;height:150px;" />
          <p>O haciendo clic aquí: <a href="${enlaceDescarga}">${enlaceDescarga}</a></p>
        `;
      }

      const html = `
        <div style="font-family: Arial, sans-serif;">
          <h2>Bienvenido/a al Sistema de Aqualab</h2>
          <p>Hola ${nombre},</p>
          <p>Se ha creado una cuenta para ti como <strong>${tipoUsuario}</strong>.</p>

          <p><strong>Credenciales de acceso:</strong></p>
          <ul>
            <li>Email: <strong>${destinatario}</strong></li>
            <li>Contraseña: <strong>${password}</strong></li>
          </ul>

          ${qrHtml}

          <p>Te recomendamos cambiar tu contraseña tras el primer inicio de sesión.</p>
          <p>Saludos cordiales,<br>Equipo Aqualab</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: destinatario,
        subject: 'Tus credenciales de acceso a Aqualab',
        html
      });

      console.log(`Correo de credenciales enviado a ${destinatario}`);
    } catch (error) {
      console.error('Error al enviar email de credenciales:', error);
      throw error;
    }
  }
}

module.exports = CredencialesEmailService;
