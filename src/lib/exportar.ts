type FilaReporte = {
  fecha: string;
  tipo: string;
  bpm: number;
  contexto: string;
  detalle: string;
};

function descargar(contenido: BlobPart, nombre: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

function escaparHtml(valor: string) {
  return valor.replace(/[&<>"']/g, (caracter) => {
    const entidades: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entidades[caracter] ?? caracter;
  });
}

export function exportarExcel(filas: FilaReporte[], desde: string, hasta: string) {
  const encabezado = ["Fecha", "Tipo", "BPM", "Contexto", "Detalle"];
  const filasHtml = filas
    .map(
      (fila) =>
        `<tr>${[fila.fecha, fila.tipo, String(fila.bpm), fila.contexto, fila.detalle]
          .map((valor) => `<td>${escaparHtml(valor)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>RitmoVital</h1><p>Reporte del ${desde} al ${hasta}</p><table><thead><tr>${encabezado.map((valor) => `<th>${valor}</th>`).join("")}</tr></thead><tbody>${filasHtml}</tbody></table></body></html>`;
  descargar(html, `ritmovital-${desde}-${hasta}.xls`, "application/vnd.ms-excel;charset=utf-8");
}

function escaparPdf(valor: string) {
  return valor.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function exportarPdf(filas: FilaReporte[], desde: string, hasta: string) {
  const lineas = [
    "RitmoVital - Reporte de salud",
    `Periodo: ${desde} a ${hasta}`,
    "",
    ...filas.map((fila) => `${fila.fecha} | ${fila.tipo} | ${fila.bpm} BPM | ${fila.contexto} | ${fila.detalle}`),
  ];
  const contenido = ["BT", "/F1 10 Tf", "50 790 Td"];
  lineas.forEach((linea, indice) => {
    if (indice > 0) contenido.push("0 -16 Td");
    contenido.push(`(${escaparPdf(linea.slice(0, 115))}) Tj`);
  });
  contenido.push("ET");
  const stream = contenido.join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objetos.forEach((objeto, indice) => {
    offsets.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });
  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
  descargar(pdf, `ritmovital-${desde}-${hasta}.pdf`, "application/pdf");
}

export type { FilaReporte };
