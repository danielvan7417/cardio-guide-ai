import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FilaReporte = {
  fecha: string;
  tipo: string;
  bpm: number;
  contexto: string;
  detalle: string;
};

function nombreArchivo(desde: string, hasta: string, extension: string) {
  return `ritmovital-${desde}-${hasta}.${extension}`;
}

export function exportarPdf(filas: FilaReporte[], desde: string, hasta: string) {
  const documento = new jsPDF({ unit: "mm", format: "a4" });
  documento.setFont("helvetica", "bold");
  documento.setFontSize(18);
  documento.text("RitmoVital", 14, 18);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(10);
  documento.text(`Reporte de salud · ${desde} a ${hasta}`, 14, 25);

  autoTable(documento, {
    startY: 32,
    head: [["Fecha", "Tipo", "BPM", "Contexto", "Detalle"]],
    body: filas.map((fila) => [fila.fecha, fila.tipo, String(fila.bpm), fila.contexto, fila.detalle]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [42, 111, 143] },
    alternateRowStyles: { fillColor: [244, 248, 250] },
    margin: { left: 14, right: 14 },
  });

  documento.save(nombreArchivo(desde, hasta, "pdf"));
}

export async function exportarExcel(filas: FilaReporte[], desde: string, hasta: string) {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Reporte de salud");
  hoja.columns = [
    { header: "Fecha", key: "fecha", width: 24 },
    { header: "Tipo", key: "tipo", width: 16 },
    { header: "BPM", key: "bpm", width: 10 },
    { header: "Contexto", key: "contexto", width: 16 },
    { header: "Detalle", key: "detalle", width: 56 },
  ];
  hoja.addRows(filas);
  hoja.insertRow(1, [`RitmoVital · Reporte de salud · ${desde} a ${hasta}`]);
  hoja.mergeCells("A1:E1");
  hoja.getRow(1).font = { bold: true, size: 14, color: { argb: "FF2A6F8F" } };
  hoja.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
  hoja.getRow(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A6F8F" } };
  hoja.views = [{ state: "frozen", ySplit: 2 }];

  const buffer = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo(desde, hasta, "xlsx");
  enlace.click();
  URL.revokeObjectURL(url);
}

export type { FilaReporte };
