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

const nameWidth = 300;

const CONTENT_TOP = 120;
const CONTENT_BOTTOM_MARGIN = 90;

// ─── MAPA DE LOGOS POR DEPENDENCIA ──────────────────────────────────────────
const DEPENDENCIA_LOGOS: Record<string, string> = {
  'DIRECCION GENERAL DE COMUNICACIÓN SOCIAL': 'assets/unidades/com_social.png',
  'DIRECCIÓN GENERAL DE COMUNICACIÓN SOCIAL': 'assets/unidades/com_social.png',
  'CONTRALORIA': 'assets/unidades/contraloria.png',
  'CONTRALORÍA': 'assets/unidades/contraloria.png',
  'INSTITUTO DE ESTUDIOS LEGISLATIVOS': 'assets/unidades/inesle.png',
  'LEGISLATURA': 'assets/unidades/lxii.png',
  'GRUPO PARLAMENTARIO DEL PMC': 'assets/unidades/mc.png',
  'GRUPO PARLAMENTARIO MORENA': 'assets/unidades/morena.png',
  'GRUPO PARLAMENTARIO DEL PAN': 'assets/unidades/pan.png',
  'GRUPO PARLAMENTARIO DEL PRD': 'assets/unidades/prd.png',
  'GRUPO PARLAMENTARIO DEL PRI': 'assets/unidades/pri.png',
  'GRUPO PARLAMENTARIO DEL PT': 'assets/unidades/pt.png',
  'SECRETARÍA DE ADMINISTRACIÓN Y FINANZAS': 'assets/unidades/saf.png',
  'SECRETARÍA DE ASUNTOS PARLAMENTARIOS': 'assets/unidades/sap.png',
  'UNIDAD DE INFORMACIÓN': 'assets/unidades/ui.png',
  'GRUPO PARLAMENTARIO DEL PVEM': 'assets/unidades/verde.png',
};

const OSFEM_LOGO = 'assets/unidades/osfem.png';
const LOGO_SIZE = 50;

// ─── LOGOS DE GRUPOS PARLAMENTARIOS (por nombre de dirección) ────────────────
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

// ─── HELPERS BÁSICOS ─────────────────────────────────────────────────────────

function getNormalizedKey(nombre: string): string {
  return nombre.trim().toUpperCase();
}

function isOsfem(depNombre: string): boolean {
  return (depNombre ?? '').toUpperCase().includes('ÓRGANO SUPERIOR DE FISCALIZACIÓN');
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

// ─── Encabezado de dependencia: logo izquierda + nombre/ubicacion/tel derecha ──
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
    try {
      doc.image(logoPath, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] });
    } catch {
      // imagen no encontrada, continuar sin logo
    }
  }

  // Nombre de la dependencia — derecha, centrado verticalmente si no hay ubicación
  const textStartY = ubicacion ? blockY + 4 : blockY + LOGO_SIZE / 2 - 8;

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text(nombre, textX, textStartY, {
      width: textWidth,
      align: 'right',
    })
    .font('Helvetica');

  // Dirección física debajo del nombre
  if (ubicacion) {
    const direccionFisica =
      `${ubicacion.calle}, Núm. ${ubicacion.num_ext}, Col. ${ubicacion.colonia}, ${ubicacion.municipio}, Estado de México, C.P. ${ubicacion.codigo_postal}`;

    doc
      .fontSize(8)
      .fillColor('#000000')
      .text(direccionFisica, textX, doc.y + 2, {
        width: textWidth,
        align: 'right',
      });

    // num_int contiene el teléfono
    if (ubicacion.num_int) {
      doc
        .fontSize(8)
        .text(`Teléfono: ${ubicacion.num_int}`, textX, doc.y + 1, {
          width: textWidth,
          align: 'right',
        });
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
) {
  const tieneUsuarios = dir.departamentos?.some(
    (d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0,
  );
  if (!tieneUsuarios) return;
  if (!Array.isArray(dir.departamentos)) return;

  // Nombre de la dirección — solo para LEGISLATURA
  if (dir.nombre && depNombre === 'LEGISLATURA') {
    const grupoLogo = getGrupoLogoPath(dir.nombre);

    if (grupoLogo) {
      // Grupo parlamentario: logo izquierda + nombre derecha
      ensureSpace(doc, LOGO_SIZE + 16);
      const blockY = doc.y + 8;
      const logoX = TABLE.startX;
      const textX = logoX + LOGO_SIZE + 12;
      const textWidth = TABLE.startX + TABLE.tableWidth - textX;

      try {
        doc.image(grupoLogo, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] });
      } catch { /* continuar */ }

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(dir.nombre, textX, blockY + LOGO_SIZE / 2 - 8, {
          width: textWidth,
          align: 'right',
        })
        .font('Helvetica');

      doc.y = blockY + LOGO_SIZE + 8;
    } else {
      // Otras direcciones de LEGISLATURA: solo texto alineado con la tabla
      ensureSpace(doc, 30);
      doc
        .moveDown(0.5)
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(dir.nombre, TABLE.startX, doc.y, {
          width: TABLE.tableWidth,
          align: 'left',
        })
        .font('Helvetica');
    }
  }

  // ── Encabezado de tabla (fila gris con EXT.) ────────────────────────────
  ensureSpace(doc, TABLE.rowHeight + 10);
  const headerY = doc.y + 5;

  doc
    .rect(TABLE.startX, headerY, TABLE.tableWidth, TABLE.rowHeight)
    .fill('#CCCCCC');

  const extColWidth = 80;
  const extColX = TABLE.startX + TABLE.tableWidth - extColWidth;

  doc
    .fillColor('#000000')
    .fontSize(10)
    .text('EXT.', extColX, headerY + 6, {
      width: extColWidth,
      align: 'right',
    });

  doc.y = headerY + TABLE.rowHeight;

  // ── Departamentos y usuarios ────────────────────────────────────────────
  dir.departamentos.forEach((dpto: any) => {
    if (!Array.isArray(dpto.usuarios) || dpto.usuarios.length === 0) return;

    // Nombre del departamento en negritas
    if (dpto.nombre && depNombre !== 'LEGISLATURA') {
      ensureSpace(doc, 24);
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(dpto.nombre, TABLE.startX + 5, doc.y, { width: nameWidth })
        .font('Helvetica');
    }

    // Filas de usuarios
    dpto.usuarios.forEach((u: any) => {
      const nameText: string = u.nombre ?? '';
      const extText: string =
        u.extension_privada || u.extension
          ? `Ext. ${u.extension_privada || u.extension}`
          : '';

      const rowEndX = TABLE.startX + TABLE.tableWidth;
      const extColX = rowEndX - extColWidth;
      const nameColX = TABLE.startX + 5;
      const nameColWidth = extColX - nameColX - 10;

      const nameHeight = doc.heightOfString(nameText, { width: nameColWidth });
      const rowHeight = Math.max(TABLE.rowHeight, nameHeight + 12);

      ensureSpace(doc, rowHeight + 2);

      const rowY = doc.y;

      // Línea separadora
      drawRowLine(doc, rowY);

      // Nombre — izquierda
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(nameText, nameColX, rowY + 6, {
          width: nameColWidth,
          lineBreak: true,
        });

      // Extensión — derecha (Y fija para no desplazarse tras el nombre)
      doc
        .fontSize(9)
        .fillColor('#000000')
        .text(extText, extColX, rowY + 6, {
          width: extColWidth,
          align: 'right',
          lineBreak: false,
        });

      // Avanzar al final de la fila
      doc.y = rowY + rowHeight;
    });
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

  // ─── PÁGINA 1: Portada ─────────────────────────────────────────────────────
  doc.image('assets/portada_directorio.png', 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // ─── PÁGINA 2: LXII ───────────────────────────────────────────────────────
  doc.addPage();
  doc.image('assets/directorio_lxii.png', 0, 0, {
    width: doc.page.width,
    height: doc.page.height,
  });

  // ─── PÁGINA 3+: Contenido ─────────────────────────────────────────────────
  doc.addPage();

  if (!Array.isArray(data)) {
    doc.text('No hay datos disponibles.');
    doc.end();
    return;
  }

  const usableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  data.forEach((dep: any) => {
    const depNombre: string = dep.dependencia ?? '';
    const depIsOsfem = isOsfem(depNombre);
    const logoPath = depIsOsfem ? null : getLogoPath(depNombre);

    // ── Encabezado de dependencia (no OSFEM) ──────────────────────────────
    if (!depIsOsfem) {
      drawDependenciaHeader(doc, depNombre, logoPath, usableWidth, dep.ubicacion);
    }

    if (!Array.isArray(dep.direcciones)) return;

    if (depIsOsfem && Array.isArray(dep.grupos_ubicacion) && dep.grupos_ubicacion.length > 0) {
      // ── OSFEM: una sección por cada ubicación física ─────────────────────
      dep.grupos_ubicacion.forEach((grupo: any) => {
        const ub = grupo.ubicacion;

        ensureSpace(doc, LOGO_SIZE + 30);
        const blockY = doc.y + 8;
        const logoX = TABLE.startX;
        const textX = logoX + LOGO_SIZE + 12;
        const textWidth = TABLE.startX + TABLE.tableWidth - textX;

        // Logo OSFEM
        try {
          doc.image(OSFEM_LOGO, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] });
        } catch { /* continuar */ }

        // Nombre de la ubicación (campo "nombre" de la tabla, ej: "OSFEM - LERDO") — derecha
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text(
            ub?.nombre ?? 'ÓRGANO SUPERIOR DE FISCALIZACIÓN',
            textX,
            blockY + 4,
            { width: textWidth, align: 'right' },
          );

        // Dirección física y teléfono debajo del nombre
        if (ub) {
          const direccionFisica =
            `${ub.calle}, Núm. ${ub.num_ext}, Col. ${ub.colonia}, ${ub.municipio}, Estado de México, C.P. ${ub.codigo_postal}`;

          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#000000')
            .text(direccionFisica, textX, doc.y + 2, {
              width: textWidth,
              align: 'right',
            });

          // num_int contiene el/los teléfonos
          if (ub.num_int) {
            doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#000000')
              .text(`Teléfono: ${ub.num_int}`, textX, doc.y + 1, {
                width: textWidth,
                align: 'right',
              });
          }
        }

        doc.y = blockY + LOGO_SIZE + 8;
        doc.fillColor('#000000');

        // Direcciones dentro de esta ubicación
        grupo.direcciones.forEach((dir: any) => {
          renderDireccion(doc, dir, depNombre, usableWidth);
        });
      });

    } else {
      // ── Dependencias normales ──────────────────────────────────────────
      dep.direcciones.forEach((dir: any) => {
        renderDireccion(doc, dir, depNombre, usableWidth);
      });
    }
  });

  // ─── PÁGINA FINAL: Servicios ──────────────────────────────────────────────
  if (Array.isArray(servicios) && servicios.length > 0) {
    doc.addPage();

    const usableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Título de sección
    ensureSpace(doc, 40);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('SERVICIOS', TABLE.startX, doc.y, {
        width: TABLE.tableWidth,
        align: 'center',
      })
      .font('Helvetica');

    doc.moveDown(0.5);

    // Encabezado de tabla (fondo gris)
    const headerY = doc.y;
    doc.rect(TABLE.startX, headerY, TABLE.tableWidth, TABLE.rowHeight).fill('#CCCCCC');

    const extColWidth = 80;
    const extColX = TABLE.startX + TABLE.tableWidth - extColWidth;

    doc
      .fillColor('#000000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('EXT.', extColX, headerY + 6, {
        width: extColWidth,
        align: 'right',
      })
      .font('Helvetica');

    doc.y = headerY + TABLE.rowHeight;

    // Filas de servicios
    servicios.forEach((srv: any) => {
      const nameText: string = srv.nombre ?? '';
      const extText: string = srv.extension ? `Ext. ${srv.extension}` : '';

      const nameColX = TABLE.startX + 5;
      const nameColWidth = extColX - nameColX - 10;
      const nameHeight = doc.heightOfString(nameText, { width: nameColWidth });
      const rowHeight = Math.max(TABLE.rowHeight, nameHeight + 12);

      ensureSpace(doc, rowHeight + 2);

      const rowY = doc.y;
      drawRowLine(doc, rowY);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(nameText, nameColX, rowY + 6, {
          width: nameColWidth,
          lineBreak: true,
        });

      doc
        .fontSize(9)
        .fillColor('#000000')
        .text(extText, extColX, rowY + 6, {
          width: extColWidth,
          align: 'right',
          lineBreak: false,
        });

      doc.y = rowY + rowHeight;
    });

    // Línea de cierre de tabla
    drawRowLine(doc, doc.y);
  }


  doc.end();
}