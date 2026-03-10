import PDFDocument from 'pdfkit';
import { Response } from 'express';

const TABLE = {
  startX: 50,
  colNombre: 60,
  colExt: 430,
  rowHeight: 22,
  tableWidth: 500,
};

const nameX = 150;
const deptX = 70;
const extX = 370;

const nameWidth = 300;
const lineHeight = 18;

function drawRowLine(doc: PDFDocument, y: number) {
  doc
    .moveTo(TABLE.startX, y)
    .lineTo(TABLE.startX + TABLE.tableWidth, y)
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
}


function drawHeaderFooter(doc: PDFDocument) {

  // encabezado
  doc.image('assets/header_directorio.png', 0, 0, {
    width: doc.page.width,
  });

  // pie
  doc.image('assets/footer_directorio.png', 0, doc.page.height - 70, {
    width: doc.page.width,
  });

}

export function generarReporteDependenciasPDF(
  data: any[],
  res: Response,
) {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 120, bottom: 90, left: 50, right: 50 },
  });



  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=directorio.pdf',
  );

  doc.pipe(res);

  // 📄 PAGINA 1
  doc.image('assets/portada_directorio.png', 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // 📄 PAGINA 2
  doc.addPage();

  doc.image('assets/directorio_lxii.png', 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // 📄 PAGINA 3
  doc.addPage();

  drawHeaderFooter(doc);

  doc.y = 120;

  // Encabezado
  doc
    .fontSize(12)
    .text('H. CONGRESO DEL ESTADO', { align: 'center' })
    .moveDown(0.5)
    .text('DIRECTORIO TELEFÓNICO', { align: 'center' })
    .moveDown(1);

  if (!Array.isArray(data)) {
    doc.text('No hay datos disponibles.');
    doc.end();
    return;
  }

  data.forEach(dep => {

    const usableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // 🔷 DEPENDENCIA
    doc
      .moveDown()
      .fontSize(12)
      .text(dep.dependencia, doc.page.margins.left, doc.y, {
        width: usableWidth,
        align: 'left',
        underline: true,
      });

    if (!Array.isArray(dep.direcciones)) return;

    dep.direcciones.forEach(dir => {

      const tieneUsuarios = dir.departamentos?.some(
        d => Array.isArray(d.usuarios) && d.usuarios.length > 0
      );

      if (!tieneUsuarios) return; // 🔴 omitir dirección completa

      if (!Array.isArray(dir.departamentos)) return;

      // 🔹 DIRECCIÓN (solo si existe)
      if (dir.nombre) {

        const usableWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;

        doc
          .moveDown()
          .fontSize(12)
          .text(dir.nombre, doc.page.margins.left, doc.y, {
            width: usableWidth,
            align: 'left',
            underline: true,
          });
      }
      const headerY = doc.y + 5;


      doc
        .fontSize(10)
        .text('NOMBRE', TABLE.colNombre, headerY + 6)
        .text('EXT.', TABLE.colExt, headerY + 6);


      doc.moveDown();

      dir.departamentos.forEach(dpto => {

        if (!Array.isArray(dpto.usuarios) || dpto.usuarios.length === 0) {
          return; // 🔴 omitir departamento vacío
        }
        if (!Array.isArray(dpto.usuarios) || !dpto.usuarios.length) return;

        // 🏢 Departamento (una sola vez)
        if (dpto.nombre && dep.dependencia !== 'LEGISLATURA') {
          doc
            .moveDown(0.8)
            .fontSize(9)
            .text(dpto.nombre, deptX, doc.y, {
              width: nameWidth,
              underline: true,
            });
        }

        // 👥 Usuarios
        dpto.usuarios.forEach(u => {

          const rowY = doc.y + 6;

          const nameText = u.nombre ?? '';

          const nameHeight = doc.heightOfString(nameText, {
            width: nameWidth,
            fontSize: 9,
          });


          // 🔹 altura final de la fila
          const rowHeight = Math.max(TABLE.rowHeight, nameHeight + 12);

          // 🔴 AQUÍ VA LA VALIDACIÓN DE SALTO DE PÁGINA
          if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();

            drawHeaderFooter(doc);

            doc.y = 120;
          }

          // reajustar Y después del addPage
          const adjustedRowY = doc.y + 6;

          // Línea superior
          drawRowLine(doc, adjustedRowY);

          // 🧑 Nombre
          doc.fontSize(9).text(nameText, nameX, adjustedRowY + 6, {
            width: nameWidth,
            lineBreak: false,
          });

          // ☎️ Extensión
          doc.fontSize(9).text(
            (u.extension_privada || u.extension) ? `Ext. ${u.extension_privada || u.extension}` : '',
            extX,
            adjustedRowY + 6,
            {
              width: 80,
              align: 'right',
              lineBreak: false,
            }
          );

          // ⬇️ mover cursor SOLO UNA VEZ
          doc.y = adjustedRowY + rowHeight;
        });
      });



    });
  });

  doc.end();
}
