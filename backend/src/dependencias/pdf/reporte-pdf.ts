import { Response } from 'express';
import PDFDocument from 'pdfkit';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDoc = require('pdfkit');

type PDFDocType = InstanceType<typeof PDFDocument>;

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

const CONTENT_TOP = 120;
const CONTENT_BOTTOM_MARGIN = 90;

function drawRowLine(doc: PDFDocType, y: number) {
  doc
    .moveTo(TABLE.startX, y)
    .lineTo(TABLE.startX + TABLE.tableWidth, y)
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
}

function drawHeaderFooter(doc: PDFDocType) {
  doc.image('assets/header_directorio.png', 0, 0, {
    width: doc.page.width,
  });

  doc.image('assets/footer_directorio.png', 0, doc.page.height - 70, {
    width: doc.page.width,
  });
}

function ensureSpace(doc: PDFDocType, neededHeight: number) {
  const bottomLimit = doc.page.height - CONTENT_BOTTOM_MARGIN;
  if (doc.y + neededHeight > bottomLimit) {
    doc.addPage();
  }
}

export function generarReporteDependenciasPDF(
  data: any[],
  res: Response,
) {
  const doc: PDFDocType = new PDFDoc({
    size: 'LETTER',
    margins: {
      top: CONTENT_TOP,
      bottom: CONTENT_BOTTOM_MARGIN,
      left: 50,
      right: 50,
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=directorio.pdf',
  );

  doc.pipe(res);

  let pageNumber = 0;

  doc.on('pageAdded', () => {
    pageNumber++;

    if (pageNumber >= 2) {
      drawHeaderFooter(doc);
      doc.y = CONTENT_TOP;
    }
  });

  // ─── PÁGINA 1: Portada ───────────────────────────────────────────────────────
  doc.image('assets/portada_directorio.png', 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // ─── PÁGINA 2: LXII ─────────────────────────────────────────────────────────
  doc.addPage();
  doc.image('assets/directorio_lxii.png', 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // ─── PÁGINA 3+: Contenido ───────────────────────────────────────────────────
  doc.addPage();

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

  const usableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  data.forEach((dep: any) => {
    ensureSpace(doc, 30);

    doc
      .moveDown(0.5)
      .fontSize(12)
      .text(dep.dependencia, doc.page.margins.left, doc.y, {
        width: usableWidth,
        align: 'left',
        underline: true,
      });

    if (!Array.isArray(dep.direcciones)) return;

    dep.direcciones.forEach((dir: any) => {
      const tieneUsuarios = dir.departamentos?.some(
        (d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0,
      );

      if (!tieneUsuarios) return;
      if (!Array.isArray(dir.departamentos)) return;

      if (dir.nombre) {
        ensureSpace(doc, 30);

        doc
          .moveDown(0.5)
          .fontSize(12)
          .text(dir.nombre, doc.page.margins.left, doc.y, {
            width: usableWidth,
            align: 'left',
          });
      }

      ensureSpace(doc, TABLE.rowHeight + 10);
      const headerY = doc.y + 5;

      doc
        .fontSize(10)
        .text('NOMBRE / DEPARTAMENTO', TABLE.colNombre, headerY + 6)
        .text('EXT.', TABLE.colExt, headerY + 6);

      doc.y = headerY + TABLE.rowHeight;

      dir.departamentos.forEach((dpto: any) => {
        if (!Array.isArray(dpto.usuarios) || dpto.usuarios.length === 0) return;

        if (dpto.nombre && dep.dependencia !== 'LEGISLATURA') {
          ensureSpace(doc, 24);

          doc
            .fontSize(9)
            .text(dpto.nombre, deptX, doc.y, {
              width: nameWidth,
            });
        }

        dpto.usuarios.forEach((u: any) => {
          const nameText: string = u.nombre ?? '';
          const extText: string =
            u.extension_privada || u.extension
              ? `Ext. ${u.extension_privada || u.extension}`
              : '';

          const nameHeight = doc.heightOfString(nameText, {
            width: nameWidth,
          });
          const rowHeight = Math.max(TABLE.rowHeight, nameHeight + 12);

          ensureSpace(doc, rowHeight + 2);

          const rowY = doc.y;

          drawRowLine(doc, rowY);

          doc.fontSize(9).text(nameText, nameX, rowY + 6, {
            width: nameWidth,
            lineBreak: true,
          });

          doc.fontSize(9).text(extText, extX, rowY + 6, {
            width: 80,
            align: 'right',
            lineBreak: false,
          });

          doc.y = rowY + rowHeight;
        });
      });
    });
  });

  doc.end();
}