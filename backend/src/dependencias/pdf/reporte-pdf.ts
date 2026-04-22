import { Response } from 'express';
import PDFDocument from 'pdfkit';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDoc = require('pdfkit');

type PDFDocType = InstanceType<typeof PDFDocument>;

const TABLE = {
  startX: 50,
  colNombre: 60,
  colExt: 430,
  rowHeight: 15,
  tableWidth: 500,
};

const nameWidth = 300;

const CONTENT_TOP = 120;
const CONTENT_BOTTOM_MARGIN = 90;

const DEPENDENCIA_LOGOS: Record<string, string> = {
  'DIRECCION GENERAL DE COMUNICACIÓN SOCIAL': 'assets/unidades/com_social.jpg',
  'DIRECCIÓN GENERAL DE COMUNICACIÓN SOCIAL': 'assets/unidades/com_social.jpg',
  'CONTRALORIA': 'assets/unidades/contraloria.jpg',
  'CONTRALORÍA': 'assets/unidades/contraloria.jpg',
  'INSTITUTO DE ESTUDIOS LEGISLATIVOS': 'assets/unidades/inesle.jpg',
  'LEGISLATURA': 'assets/unidades/lxii.png',
  'GRUPO PARLAMENTARIO DEL PMC': 'assets/unidades/mc.png',
  'GRUPO PARLAMENTARIO MORENA': 'assets/unidades/morena.png',
  'GRUPO PARLAMENTARIO DEL PAN': 'assets/unidades/pan.png',
  'GRUPO PARLAMENTARIO DEL PRD': 'assets/unidades/prd.png',
  'GRUPO PARLAMENTARIO DEL PRI': 'assets/unidades/pri.png',
  'GRUPO PARLAMENTARIO DEL PT': 'assets/unidades/pt.png',
  'SECRETARÍA DE ADMINISTRACIÓN Y FINANZAS': 'assets/unidades/saf.jpg',
  'SECRETARÍA DE ASUNTOS PARLAMENTARIOS': 'assets/unidades/sap.png',
  'UNIDAD DE INFORMACIÓN': 'assets/unidades/ui.png',
  'GRUPO PARLAMENTARIO DEL PVEM': 'assets/unidades/verde.png',
};

const OSFEM_LOGO = 'assets/unidades/osfem.jpg';
const LOGO_SIZE = 50;

const GRUPO_LOGOS: Record<string, string> = {
  'GRUPO PARLAMENTARIO DEL PMC': 'assets/unidades/mc.png',
  'GRUPO PARLAMENTARIO MORENA': 'assets/unidades/morena.png',
  'GRUPO PARLAMENTARIO DEL PAN': 'assets/unidades/pan.png',
  'GRUPO PARLAMENTARIO DEL PRD': 'assets/unidades/prd.png',
  'GRUPO PARLAMENTARIO DEL PRI': 'assets/unidades/pri.png',
  'GRUPO PARLAMENTARIO DEL PT': 'assets/unidades/pt.png',
  'GRUPO PARLAMENTARIO DEL PVEM': 'assets/unidades/verde.png',
};

function getGrupoLogoPath(dirNombre: string): string | null {
  return GRUPO_LOGOS[dirNombre.trim().toUpperCase()] ?? null;
}

function getNormalizedKey(nombre: string): string {
  return nombre.trim().toUpperCase();
}

function isOsfem(depNombre: string): boolean {
  return (depNombre ?? '').toUpperCase().includes('RGANO SUPERIOR DE FISCALIZACI');
}

function getLogoPath(depNombre: string): string | null {
  const key = getNormalizedKey(depNombre);
  return DEPENDENCIA_LOGOS[key] ?? null;
}

function drawRowLine(doc: PDFDocType, y: number) {
  doc.save();
  doc
    .moveTo(TABLE.startX, y)
    .lineTo(TABLE.startX + TABLE.tableWidth, y)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();
  doc.restore();
}

function drawHeaderFooter(doc: PDFDocType) {
  doc.image('assets/header_directorio.png', 0, 0, { width: doc.page.width });
  doc.image('assets/footer_directorio.png', 0, doc.page.height - 70, { width: doc.page.width });
}

function ensureSpace(doc: PDFDocType, neededHeight: number) {
  const bottomLimit = doc.page.height - CONTENT_BOTTOM_MARGIN;
  if (doc.y + neededHeight > bottomLimit) {
    doc.addPage();
  }
}

function drawExtHeader(doc: PDFDocType) {
  ensureSpace(doc, 16 + 10);
  const headerY = doc.y + 5;
  const extColWidth = 80;
  const extColX = TABLE.startX + TABLE.tableWidth - extColWidth;
  doc.rect(TABLE.startX, headerY, TABLE.tableWidth, 16).fill('#CCCCCC');
  doc.fillColor('#000000').fontSize(10)
    .text('EXT.', extColX, headerY + 3, { width: extColWidth, align: 'right' });
  doc.y = headerY + 16;
}

function renderTitular(
  doc: PDFDocType,
  titulo: string,
  nombre: string,
  extension: string,
) {
  ensureSpace(doc, 40);
  const extColWidth = 80;
  const rowY = doc.y + 6;
  const extColX = TABLE.startX + TABLE.tableWidth - extColWidth;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
    .text(titulo, TABLE.startX, rowY, { width: TABLE.tableWidth - extColWidth })
    .font('Helvetica');

  if (extension) {
    doc.fontSize(8).text(extension, extColX, rowY, { width: extColWidth, align: 'right', lineBreak: false });
  }

  doc.y = doc.y + 2;

  if (nombre) {
    doc.fontSize(8).font('Helvetica').fillColor('#000000')
      .text(nombre, TABLE.startX, doc.y, { width: TABLE.tableWidth });
  }

  doc.moveDown(0.3);
}

function drawDependenciaHeader(
  doc: PDFDocType,
  nombre: string,
  logoPath: string | null,
  usableWidth: number,
  ubicacion?: any,
) {
  ensureSpace(doc, LOGO_SIZE + 16);
  const blockY = doc.y + 8;
  const logoX = TABLE.startX;
  const textX = logoX + LOGO_SIZE + 12;
  const textWidth = TABLE.startX + TABLE.tableWidth - textX;

  if (logoPath) {
    try { doc.image(logoPath, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] }); } catch { /* continuar */ }
  }

  const textStartY = ubicacion ? blockY + 4 : blockY + LOGO_SIZE / 2 - 8;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
    .text(nombre, textX, textStartY, { width: textWidth, align: 'right' })
    .font('Helvetica');

  if (ubicacion) {
    const direccionFisica = `${ubicacion.calle}, Núm. ${ubicacion.num_ext}, Col. ${ubicacion.colonia}, ${ubicacion.municipio}, Estado de México, C.P. ${ubicacion.codigo_postal}`;
    doc.fontSize(7).fillColor('#000000')
      .text(direccionFisica, textX, doc.y + 2, { width: textWidth, align: 'right' });
    if (ubicacion.num_int) {
      doc.fontSize(7).text(`Teléfono: ${ubicacion.num_int}`, textX, doc.y + 1, { width: textWidth, align: 'right' });
    }
  }

  doc.y = blockY + LOGO_SIZE + 8;
}

// ─── Renderiza una dirección completa con sus departamentos y usuarios ────────
function renderDireccion(
  doc: PDFDocType,
  dir: any,
  depNombre: string,
  usableWidth: number,
  encargadosMap: Map<number, { nombre: string; departamento_id: number }>,
  skipHeader = false,  // 👈 nuevo parámetro
) {
  const tieneUsuarios = dir.departamentos?.some(
    (d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0,
  );
  if (!tieneUsuarios) return;
  if (!Array.isArray(dir.departamentos)) return;

  if (dir.nombre && depNombre === 'LEGISLATURA') {
    const grupoLogo = getGrupoLogoPath(dir.nombre);
    if (grupoLogo) {
      ensureSpace(doc, LOGO_SIZE + 16);
      const blockY = doc.y + 8;
      const logoX = TABLE.startX;
      const textX = logoX + LOGO_SIZE + 12;
      const textWidth = TABLE.startX + TABLE.tableWidth - textX;
      try { doc.image(grupoLogo, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] }); } catch { /* continuar */ }
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text(dir.nombre, textX, blockY + LOGO_SIZE / 2 - 8, { width: textWidth, align: 'right' })
        .font('Helvetica');
      doc.y = blockY + LOGO_SIZE + 8;
    } else {
      ensureSpace(doc, 30);
      doc.moveDown(0.5).fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text(dir.nombre, TABLE.startX, doc.y, { width: TABLE.tableWidth, align: 'left' })
        .font('Helvetica');
    }
  }

  // ── Encabezado gris con EXT. — solo si no se saltó ─────────────────────
  const extColWidth = 80;
  const extColX = TABLE.startX + TABLE.tableWidth - extColWidth;

  if (!skipHeader) {
    ensureSpace(doc, TABLE.rowHeight + 10);
    const headerY = doc.y + 5;
    doc.rect(TABLE.startX, headerY, TABLE.tableWidth, 16).fill('#CCCCCC');
    doc.fillColor('#000000').fontSize(10)
      .text('EXT.', extColX, headerY + 3, { width: extColWidth, align: 'right' });
    doc.y = headerY + 16;
  }

  // ── Departamentos y usuarios ────────────────────────────────────────────
  dir.departamentos.forEach((dpto: any) => {
    if (!Array.isArray(dpto.usuarios) || dpto.usuarios.length === 0) return;

    let esPrimerUsuario = true;

    if (dpto.nombre && depNombre !== 'LEGISLATURA') {
      ensureSpace(doc, 24);
      drawRowLine(doc, doc.y);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000')
        .text(dpto.nombre, TABLE.startX + 5, doc.y + 3, { width: TABLE.tableWidth })
        .font('Helvetica');
    }

    dpto.usuarios.forEach((u: any) => {
      const encargadoInfo = encargadosMap.get(u.id_Usuario);
      const deptEncargado = encargadoInfo?.nombre ?? null;
      const nameText: string = u.nombre ?? '';
      const extText: string =
        u.extension_privada || u.extension
          ? `Ext. ${u.extension_privada || u.extension}`
          : '';

      const nameColX = TABLE.startX + 5;
      const nameColWidth = extColX - nameColX - 10;
      const extColWidth2 = extColX;

      const encargadoLine = deptEncargado ? `Encargado: ${deptEncargado}` : '';
      const nameHeight = doc.heightOfString(nameText, { width: nameColWidth });
      doc.fontSize(8);
      const extHeight = doc.heightOfString(extText, { width: extColWidth });
      const encHeight = deptEncargado ? doc.heightOfString(encargadoLine, { width: nameColWidth }) : 0;
      const totalTextHeight = Math.max(nameHeight, extHeight) + (deptEncargado ? encHeight + 2 : 0);
      const rowHeight = Math.max(TABLE.rowHeight, totalTextHeight + 8);

      ensureSpace(doc, rowHeight + 2);
      const rowY = doc.y;

      if (!esPrimerUsuario) drawRowLine(doc, rowY);
      esPrimerUsuario = false;

      doc.fontSize(8).font('Helvetica').fillColor('#000000')
        .text(nameText, nameColX, rowY + 4, { width: nameColWidth, lineBreak: false });

      if (deptEncargado) {
        const encY = rowY + 6 + nameHeight + 2;
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
          .text(encargadoLine, nameColX, encY, { width: nameColWidth, lineBreak: false });
      }

      doc.fontSize(8).font('Helvetica').fillColor('#000000')
        .text(extText, extColX, rowY + 4, {
          width: extColWidth,
          align: 'right',
          lineBreak: true
        });

      doc.y = rowY + rowHeight;
    });
    if (dir.nombre === 'JUNTA DE COORDINACIÓN POLÍTICA') {
      drawRowLine(doc, doc.y);
    }
  });
}

// ─── EXPORT PRINCIPAL ────────────────────────────────────────────────────────
export function generarReporteDependenciasPDF(
  data: any[],
  servicios: any[],
  res: Response,
) {
  const doc: PDFDocType = new PDFDoc({
    size: 'LETTER',
    margins: { top: CONTENT_TOP, bottom: CONTENT_BOTTOM_MARGIN, left: 50, right: 50 },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=directorio.pdf');
  doc.pipe(res);
  let pageNumber = 1; // 👈 empieza en 1 porque la portada ya existe

  doc.on('pageAdded', () => {
    pageNumber++;
    if (pageNumber >= 2) { // 👈 a partir de página 3 (después de portada y lxii)
      drawHeaderFooter(doc);
      doc.y = CONTENT_TOP;
    }
  });

  doc.image('assets/portada_directorio.png', 0, 0, { width: doc.page.width, height: doc.page.height });

  doc.addPage();
  doc.image('assets/directorio_lxii.png', TABLE.startX, CONTENT_TOP, {
    width: doc.page.width - (TABLE.startX * 2),
    height: doc.page.height - CONTENT_TOP - CONTENT_BOTTOM_MARGIN,
  });
  doc.addPage();

  if (!Array.isArray(data)) {
    doc.text('No hay datos disponibles.');
    doc.end();
    return;
  }

  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const encargadosMap = new Map<number, { nombre: string; departamento_id: number }>();
  data.forEach((dep: any) => {
    dep.encargados?.forEach((enc: any) => {
      if (enc.usuario_id && enc.t_departamento?.nombre_completo) {
        encargadosMap.set(Number(enc.usuario_id), {
          nombre: enc.t_departamento.nombre_completo,
          departamento_id: Number(enc.departamento_id),
        });
      }
    });
  });

  data.forEach((dep: any) => {
    const depNombre: string = dep.dependencia ?? '';
    const depIsOsfem = dep.id_Dependencia === 3;
    const logoPath = depIsOsfem ? null : getLogoPath(depNombre);


    if (!depIsOsfem) {
      drawDependenciaHeader(doc, depNombre, logoPath, usableWidth, dep.ubicacion);
    }

    // ✅ MOVER el return aquí adentro, solo para dependencias normales
    if (depIsOsfem && Array.isArray(dep.grupos_ubicacion) && dep.grupos_ubicacion.length > 0) {
      // ── OSFEM: una sección por cada ubicación física ─────────────────────
      dep.grupos_ubicacion.forEach((grupo: any) => {
        const tieneUsuarios = grupo.direcciones?.some((dir: any) =>
          dir.departamentos?.some((d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0)
        );
        if (!tieneUsuarios) return;

        const ub = grupo.ubicacion;
        ensureSpace(doc, LOGO_SIZE + 30);
        const blockY = doc.y + 8;
        const logoX = TABLE.startX;
        const textX = logoX + LOGO_SIZE + 12;
        const textWidth = TABLE.startX + TABLE.tableWidth - textX;

        try { doc.image(OSFEM_LOGO, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] }); } catch { /* continuar */ }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text(ub?.nombre ?? 'ÓRGANO SUPERIOR DE FISCALIZACIÓN', textX, blockY + 4, { width: textWidth, align: 'right' });

        if (ub) {
          const direccionFisica = `${ub.calle}, Núm. ${ub.num_ext}, Col. ${ub.colonia}, ${ub.municipio}, Estado de México, C.P. ${ub.codigo_postal}`;
          doc.fontSize(7).font('Helvetica').fillColor('#000000')
            .text(direccionFisica, textX, doc.y + 2, { width: textWidth, align: 'right' });
          if (ub.num_int) {
            doc.fontSize(7).font('Helvetica').fillColor('#000000')
              .text(`Teléfono: ${ub.num_int}`, textX, doc.y + 1, { width: textWidth, align: 'right' });
          }
        }

        doc.y = blockY + LOGO_SIZE + 8;
        doc.fillColor('#000000');

        drawExtHeader(doc);

        grupo.direcciones.forEach((dir: any) => {
          renderDireccion(doc, dir, depNombre, usableWidth, encargadosMap, true);
        });
      });

    } else {
      // ── Dependencias normales ─────────────────────────────────────────────
      if (!Array.isArray(dep.direcciones)) return; // 👈 return solo aplica aquí

      const tieneUsuarios = dep.direcciones.some((dir: any) =>
        dir.departamentos?.some((d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0)
      );

      if (tieneUsuarios) drawExtHeader(doc);

      dep.direcciones.forEach((dir: any) => {
        renderDireccion(doc, dir, depNombre, usableWidth, encargadosMap, true);
      });
    }
  });

  // ─── PÁGINA FINAL: Servicios ──────────────────────────────────────────────
  if (Array.isArray(servicios) && servicios.length > 0) {
    doc.addPage();

    ensureSpace(doc, 40);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
      .text('SERVICIOS', TABLE.startX, doc.y, { width: TABLE.tableWidth, align: 'center' })
      .font('Helvetica');

    doc.moveDown(0.5);

    const headerY = doc.y;
    doc.rect(TABLE.startX, headerY, TABLE.tableWidth, TABLE.rowHeight).fill('#CCCCCC');

    const extColWidth = 80;
    const extColX = TABLE.startX + TABLE.tableWidth - extColWidth;

    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
      .text('Ext.', extColX, headerY + 6, { width: extColWidth, align: 'right' })
      .font('Helvetica');

    doc.y = headerY + TABLE.rowHeight;

    servicios.forEach((srv: any) => {
      const nameText: string = srv.nombre ?? '';
      const extText: string = srv.extension ? `Ext. ${srv.extension}` : '';

      const nameColX = TABLE.startX + 5;
      const nameColWidth = extColX - nameColX - 10;
      const nameHeight = doc.heightOfString(nameText, { width: nameColWidth });
      const extHeight = doc.heightOfString(extText, { width: extColWidth });  // 👈
      const rowHeight = Math.max(TABLE.rowHeight, Math.max(nameHeight, extHeight) + 8);  // 👈 max entre nombre y ext

      ensureSpace(doc, rowHeight + 2);
      const rowY = doc.y;
      drawRowLine(doc, rowY);

      doc.fontSize(8).font('Helvetica').fillColor('#000000')
        .text(nameText, nameColX, rowY + 4, { width: nameColWidth, lineBreak: true });

      doc.fontSize(8).fillColor('#000000')
        .text(extText, extColX, rowY + 4, {  // 👈 rowY + 4 igual que el nombre
          width: extColWidth,
          align: 'right',
          lineBreak: true,  // 👈 permitir salto
        });

      doc.y = rowY + rowHeight;
    });

    drawRowLine(doc, doc.y);
  }

  doc.end();
}