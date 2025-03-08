const PDFDocument = require("pdfkit");
const fs = require("fs");

const limpiarBase64 = (firma) => firma.replace(/^data:image\/\w+;base64,/, "");

const generarPDF = async (muestra, cedulaCliente, firmaCliente, cedulaLaboratorista, firmaLaboratorista) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const fileName = `muestra_${muestra.id_muestra}.pdf`;
    const filePath = `./pdfs/${fileName}`;

    // Crear carpeta si no existe
    if (!fs.existsSync("./pdfs")) {
      fs.mkdirSync("./pdfs");
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).text("Reporte de Muestra", { align: "center" });
    doc.moveDown();

    // Datos de la Muestra
    doc.fontSize(14).text(`ID Muestra: ${muestra.id_muestra}`);
    doc.text(`Fecha Registro: ${new Date(muestra.fechaHora).toLocaleDateString()}`);
    doc.moveDown();

    // Firma del Laboratorista
    doc.text(`Cédula Laboratorista: ${cedulaLaboratorista}`);
    doc.text("Firma Laboratorista:");
    doc.image(Buffer.from(limpiarBase64(firmaLaboratorista), "base64"), { width: 150, height: 80 });
    doc.moveDown();

    // Firma del Cliente
    doc.text(`Cédula Cliente: ${cedulaCliente}`);
    doc.text("Firma Cliente:");
    doc.image(Buffer.from(limpiarBase64(firmaCliente), "base64"), { width: 150, height: 80 });
    doc.moveDown();

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = generarPDF;
