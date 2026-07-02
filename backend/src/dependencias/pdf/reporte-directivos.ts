import { Response } from 'express';
import PDFDocument from 'pdfkit';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDoc = require('pdfkit');

type PDFDocType = InstanceType<typeof PDFDocument>;

// ─── Layout (igual que reporte-pdf, solo las columnas de extensión cambian) ──
const TABLE = {
  startX: 40,
  tableWidth: 525,
  rowHeight: 15,
};

// Dos columnas de extensión de 80px cada una
const EXT_COL_W   = 80;
const EXT1_X      = TABLE.startX + TABLE.tableWidth - EXT_COL_W * 2; // EXT. PRIVADA
const EXT2_X      = TABLE.startX + TABLE.tableWidth - EXT_COL_W;     // EXT. PÚBLICA
const NAME_COL_X  = TABLE.startX + 5;
const NAME_COL_W  = EXT1_X - NAME_COL_X - 5;

const CONTENT_TOP           = 120;
const CONTENT_BOTTOM_MARGIN = 90;
const LOGO_SIZE             = 50;

// ─── Logos (idéntico a reporte-pdf) ──────────────────────────────────────────
const DEPENDENCIA_LOGOS: Record<string, string> = {
  'DIRECCION GENERAL DE COMUNICACIÓN SOCIAL':  'assets/unidades/com_social.jpg',
  'DIRECCIÓN GENERAL DE COMUNICACIÓN SOCIAL':  'assets/unidades/com_social.jpg',
  'CONTRALORIA':                               'assets/unidades/contraloria.jpg',
  'CONTRALORÍA':                               'assets/unidades/contraloria.jpg',
  'INSTITUTO DE ESTUDIOS LEGISLATIVOS':        'assets/unidades/inesle.jpg',
  'LEGISLATURA':                               'assets/unidades/lxii.png',
  'GRUPO PARLAMENTARIO DEL PMC':               'assets/unidades/mc.png',
  'GRUPO PARLAMENTARIO MORENA':                'assets/unidades/morena.png',
  'GRUPO PARLAMENTARIO DEL PAN':               'assets/unidades/pan.png',
  'GRUPO PARLAMENTARIO DEL PRD':               'assets/unidades/prd.png',
  'GRUPO PARLAMENTARIO DEL PRI':               'assets/unidades/pri.png',
  'GRUPO PARLAMENTARIO DEL PT':               'assets/unidades/pt.png',
  'SECRETARÍA DE ADMINISTRACIÓN Y FINANZAS':   'assets/unidades/saf.jpg',
  'SECRETARÍA DE ASUNTOS PARLAMENTARIOS':      'assets/unidades/sap.png',
  'UNIDAD DE INFORMACIÓN':                     'assets/unidades/ui.png',
  'GRUPO PARLAMENTARIO DEL PVEM':              'assets/unidades/verde.png',
};

const OSFEM_LOGO = 'assets/unidades/osfem.jpg';

const GRUPO_LOGOS: Record<string, string> = {
  'GRUPO PARLAMENTARIO DEL PMC':  'assets/unidades/mc.png',
  'GRUPO PARLAMENTARIO MORENA':   'assets/unidades/morena.png',
  'GRUPO PARLAMENTARIO DEL PAN':  'assets/unidades/pan.png',
  'GRUPO PARLAMENTARIO DEL PRD':  'assets/unidades/prd.png',
  'GRUPO PARLAMENTARIO DEL PRI':  'assets/unidades/pri.png',
  'GRUPO PARLAMENTARIO DEL PT':  'assets/unidades/pt.png',
  'GRUPO PARLAMENTARIO DEL PVEM': 'assets/unidades/verde.png',
};

function getGrupoLogoPath(dirNombre: string): string | null {
  return GRUPO_LOGOS[dirNombre.trim().toUpperCase()] ?? null;
}

function isOsfem(depNombre: string): boolean {
  return (depNombre ?? '').toUpperCase().includes('RGANO SUPERIOR DE FISCALIZACI');
}

function getLogoPath(depNombre: string): string | null {
  return DEPENDENCIA_LOGOS[depNombre.trim().toUpperCase()] ?? null;
}

// ─── Utilidades (idénticas a reporte-pdf) ────────────────────────────────────
function drawRowLine(doc: PDFDocType, y: number) {
  doc.save()
    .moveTo(TABLE.startX, y).lineTo(TABLE.startX + TABLE.tableWidth, y)
    .strokeColor('#000000').lineWidth(0.5).stroke()
    .restore();
}

function drawHeaderFooter(doc: PDFDocType) {
  doc.image('assets/header_directorio.jpg', 0, 0, { width: doc.page.width });
  doc.image('assets/footer_directorio.jpg', 0, doc.page.height - 70, { width: doc.page.width });
}

function ensureSpace(doc: PDFDocType, neededHeight: number) {
  if (doc.y + neededHeight > doc.page.height - CONTENT_BOTTOM_MARGIN) {
    doc.addPage();
  }
}

// ─── Cabecera de tabla con DOS columnas de extensión ─────────────────────────
function drawExtHeader(doc: PDFDocType) {
  ensureSpace(doc, 16 + 10);
  const headerY = doc.y + 5;

  doc.rect(TABLE.startX, headerY, TABLE.tableWidth, 16).fill('#CCCCCC');

  doc.fillColor('#000000').fontSize(8)
    .text('EXT. PRIVADA', EXT1_X, headerY + 3, { width: EXT_COL_W, align: 'center', lineBreak: false })
    .text('EXT. PÚBLICA',  EXT2_X, headerY + 3, { width: EXT_COL_W, align: 'center', lineBreak: false });

  doc.y = headerY + 16;
}

// ─── Cabecera de dependencia (idéntica a reporte-pdf) ────────────────────────
function drawDependenciaHeader(
  doc: PDFDocType,
  nombre: string,
  logoPath: string | null,
  usableWidth: number,
  ubicacion?: any,
) {
  ensureSpace(doc, LOGO_SIZE + 16);
  const blockY  = doc.y + 8;
  const logoX   = TABLE.startX;
  const textX   = logoX + LOGO_SIZE + 12;
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

// ─── Renderiza una dirección con DOS columnas de extensión ───────────────────
function renderDireccion(
  doc: PDFDocType,
  dir: any,
  depNombre: string,
  usableWidth: number,
  encargadosMap: Map<number, { nombre: string; departamento_id: number }>,
  skipHeader = false,
) {
  const tieneUsuarios = dir.departamentos?.some(
    (d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0,
  );
  if (!tieneUsuarios) return;
  if (!Array.isArray(dir.departamentos)) return;

  // Cabecera de grupo parlamentario (Legislatura)
  if (dir.nombre && depNombre === 'LEGISLATURA') {
    const grupoLogo = getGrupoLogoPath(dir.nombre);
    if (grupoLogo) {
      ensureSpace(doc, LOGO_SIZE + 16);
      const blockY   = doc.y + 8;
      const logoX    = TABLE.startX;
      const textX    = logoX + LOGO_SIZE + 12;
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

  // Cabecera gris con las dos columnas (siempre para grupos de Legislatura)
  const isLegislaturaGroup = !!(dir.nombre && depNombre === 'LEGISLATURA');
  if (!skipHeader || isLegislaturaGroup) {
    drawExtHeader(doc);
  }

  // Departamentos y usuarios
  dir.departamentos.forEach((dpto: any) => {
    if (!Array.isArray(dpto.usuarios) || dpto.usuarios.length === 0) return;

    let esPrimerUsuario = true;

    if (dpto.nombre && depNombre !== 'LEGISLATURA') {
      ensureSpace(doc, 24);
      drawRowLine(doc, doc.y);
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000')
        .text(dpto.nombre, TABLE.startX + 5, doc.y + 3, { width: TABLE.tableWidth })
        .font('Helvetica');
    }

    dpto.usuarios.forEach((u: any) => {
      const nameText   = u.nombre ?? '';
      const extPrivada = u.extension_publica  ?? '';
      const extPublica  = u.extension_privada ?? '';

      doc.fontSize(7);
      const nameHeight = doc.heightOfString(nameText, { width: NAME_COL_W });
      const rowHeight  = Math.max(TABLE.rowHeight, nameHeight + 8);

      ensureSpace(doc, rowHeight + 2);
      const rowY = doc.y;

      if (!esPrimerUsuario) drawRowLine(doc, rowY);
      esPrimerUsuario = false;

      // Nombre: alineado arriba
      doc.font('Helvetica').fillColor('#000000')
        .text(nameText, NAME_COL_X, rowY + 4, { width: NAME_COL_W, lineBreak: true });

      // Extensiones: centradas verticalmente en el renglón
      const extLineH = 8; // altura aproximada de 7pt
      const extY = rowY + (rowHeight - extLineH) / 2;

      if (extPrivada) {
        doc.fontSize(7).font('Helvetica')
          .text(extPrivada, EXT1_X, extY, { width: EXT_COL_W, align: 'center', lineBreak: false });
      }
      if (extPublica) {
        doc.fontSize(7).font('Helvetica')
          .text(extPublica, EXT2_X, extY, { width: EXT_COL_W, align: 'center', lineBreak: false });
      }

      doc.y = rowY + rowHeight;
    });

    if (dir.nombre === 'JUNTA DE COORDINACIÓN POLÍTICA') {
      drawRowLine(doc, doc.y);
    }
  });
}

// ─── EXPORT PRINCIPAL ────────────────────────────────────────────────────────
export function generarReporteDirectivosPDF(data: any[], res: Response) {
  const doc: PDFDocType = new PDFDoc({
    size: 'LETTER',
    margins: { top: CONTENT_TOP, bottom: CONTENT_BOTTOM_MARGIN, left: 40, right: 40 },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reporte-directivos.pdf');
  doc.pipe(res);

  let pageNumber = 1;
  doc.on('pageAdded', () => {
    pageNumber++;
    if (pageNumber >= 2) {
      drawHeaderFooter(doc);
      doc.y = CONTENT_TOP;
    }
  });

  // Portada
  doc.image('assets/portada_directorio.jpg', 0, 0, { width: doc.page.width, height: doc.page.height });

  // Página LXII
  doc.addPage();
  doc.image('assets/directorio_lxii.png', TABLE.startX, CONTENT_TOP, {
    width:  doc.page.width - TABLE.startX * 2,
    height: doc.page.height - CONTENT_TOP - CONTENT_BOTTOM_MARGIN,
  });
  doc.addPage();

  if (!Array.isArray(data)) {
    doc.text('No hay datos disponibles.');
    doc.end();
    return;
  }

  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Mapa de encargados
  const encargadosMap = new Map<number, { nombre: string; departamento_id: number }>();
  data.forEach((dep: any) => {
    dep.encargados?.forEach((enc: any) => {
      if (enc.usuario_id && enc.t_departamento?.nombre_completo) {
        encargadosMap.set(Number(enc.usuario_id), {
          nombre:         enc.t_departamento.nombre_completo,
          departamento_id: Number(enc.departamento_id),
        });
      }
    });
  });

  data.forEach((dep: any) => {
    const depNombre: string = dep.dependencia ?? '';
    const depIsOsfem       = dep.id_Dependencia === 3;
    const logoPath         = depIsOsfem ? null : getLogoPath(depNombre);

    if (!depIsOsfem) {
      drawDependenciaHeader(doc, depNombre, logoPath, usableWidth, dep.ubicacion);
    }

    // OSFEM: sección por ubicación física
    if (depIsOsfem && Array.isArray(dep.grupos_ubicacion) && dep.grupos_ubicacion.length > 0) {
      dep.grupos_ubicacion.forEach((grupo: any) => {
        const tieneUsuarios = grupo.direcciones?.some((dir: any) =>
          dir.departamentos?.some((d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0),
        );
        if (!tieneUsuarios) return;

        const ub = grupo.ubicacion;
        ensureSpace(doc, LOGO_SIZE + 30);
        const blockY    = doc.y + 8;
        const logoX     = TABLE.startX;
        const textX     = logoX + LOGO_SIZE + 12;
        const textWidth = TABLE.startX + TABLE.tableWidth - textX;

        try { doc.image(OSFEM_LOGO, logoX, blockY, { fit: [LOGO_SIZE, LOGO_SIZE] }); } catch { /* continuar */ }

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
          .text(ub?.nombre ?? 'ÓRGANO SUPERIOR DE FISCALIZACIÓN', textX, blockY + 4, { width: textWidth, align: 'right' });

        if (ub) {
          const direccionFisica = `${ub.calle}, Núm. ${ub.num_ext}, Col. ${ub.colonia}, ${ub.municipio}, Estado de México, C.P. ${ub.codigo_postal}`;
          doc.fontSize(7).font('Helvetica').fillColor('#000000')
            .text(direccionFisica, textX, doc.y + 2, { width: textWidth, align: 'right' });
          if (ub.num_int) {
            doc.fontSize(7).text(`Teléfono: ${ub.num_int}`, textX, doc.y + 1, { width: textWidth, align: 'right' });
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
      // Dependencias normales
      if (!Array.isArray(dep.direcciones)) return;

      const tieneUsuarios = dep.direcciones.some((dir: any) =>
        dir.departamentos?.some((d: any) => Array.isArray(d.usuarios) && d.usuarios.length > 0),
      );

      if (tieneUsuarios) drawExtHeader(doc);

      dep.direcciones.forEach((dir: any) => {
        renderDireccion(doc, dir, depNombre, usableWidth, encargadosMap, true);
      });
    }
  });

  doc.end();
}
