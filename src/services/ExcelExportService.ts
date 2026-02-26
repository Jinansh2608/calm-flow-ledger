// ============================================================
// EXCEL EXPORT SERVICE — Client 2 BOQ Quotation Format
// ============================================================

import * as XLSX from 'xlsx';
import {
  ColumnConfig,
  QUOTATION_COLUMNS,
  QuotationHeader,
  calculateRowTotals,
  getGrandTotals,
} from '@/config/DynamicColumnConfig';

export interface ExportTableData {
  title: string;
  columns: ColumnConfig[];
  rows: Record<string, any>[];
  totals?: Record<string, number>;
}

// ============================================================
// QUOTATION EXPORT WITH HEADER (Primary Export)
// ============================================================

export function exportQuotationWithHeader(
  header: QuotationHeader,
  rows: Record<string, any>[]
): void {
  const wb = XLSX.utils.book_new();
  const sheetData: any[][] = [];

  // Header lines: Store ID + 4 fields
  sheetData.push([`Store ID: ${header.storeId}`]);
  sheetData.push([header.storeLocation]);
  sheetData.push([header.fullAddress]);
  sheetData.push([header.companyName]);
  sheetData.push([header.totalArea]);

  // Empty row separator
  sheetData.push([]);

  // Column headers
  const columnHeaders = QUOTATION_COLUMNS.map(col => col.label);
  sheetData.push(columnHeaders);

  // Data rows — only grid columns, no calculation columns
  rows.forEach(row => {
    const dataRow = QUOTATION_COLUMNS.map(col => {
      const val = row[col.key];
      if (col.format === 'percentage' && typeof val === 'number') {
        return `${val}%`;
      }
      return val ?? '';
    });
    sheetData.push(dataRow);
  });

  // Empty row before totals
  sheetData.push([]);

  // Totals section
  const totals = getGrandTotals(rows);
  sheetData.push(['', '', '', '', '', 'Subtotal:', formatNumber(totals.subtotal)]);
  sheetData.push(['', '', '', '', '', 'Total GST:', formatNumber(totals.totalGST)]);
  sheetData.push(['', '', '', '', '', 'Final Amount:', formatNumber(totals.finalAmount)]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-fit column widths
  ws['!cols'] = QUOTATION_COLUMNS.map((col, i) => {
    let maxLen = col.label.length;
    rows.forEach(row => {
      const cellLen = String(row[col.key] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    // First column (header text) might be wider
    if (i === 0) {
      maxLen = Math.max(maxLen, header.fullAddress.length, header.storeLocation.length, 40);
    }
    return { wch: Math.min(Math.max(maxLen + 2, 12), 60) };
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Quotation');

  const date = new Date().toISOString().split('T')[0];
  const storeRef = (header.storeId || header.storeLocation).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) || 'Export';
  XLSX.writeFile(wb, `Quotation_${storeRef}_${date}.xlsx`);
}

// ============================================================
// SINGLE TABLE EXPORT (Generic)
// ============================================================

export function exportSingleTable(
  tableData: ExportTableData,
  fileName: string
): void {
  const wb = XLSX.utils.book_new();

  const headers = tableData.columns.map(col => col.label);
  const dataRows = tableData.rows.map(row =>
    tableData.columns.map(col => {
      const val = row[col.key];
      if (col.format === 'currency' && typeof val === 'number') return val;
      if (col.format === 'percentage' && typeof val === 'number') return `${val}%`;
      return val ?? '';
    })
  );

  const sheetData = [headers, ...dataRows];

  if (tableData.totals) {
    const totalRow = tableData.columns.map(col => {
      if (tableData.totals && tableData.totals[col.key] !== undefined) {
        return tableData.totals[col.key];
      }
      if (col.key === tableData.columns[0].key) return 'TOTAL';
      return '';
    });
    sheetData.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = tableData.columns.map((col, i) => {
    let maxLen = col.label.length;
    dataRows.forEach(row => {
      const cellLen = String(row[i] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.max(maxLen + 2, 10) };
  });

  XLSX.utils.book_append_sheet(wb, ws, tableData.title.substring(0, 31));
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ============================================================
// MULTI-TABLE SIDE-BY-SIDE EXPORT
// ============================================================

export function exportMultiTableSideBySide(
  tables: ExportTableData[],
  fileName: string
): void {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  let currentCol = 0;
  const allColWidths: XLSX.ColInfo[] = [];
  let maxRows = 0;

  tables.forEach((table, tableIndex) => {
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: currentCol });
    ws[titleCell] = { v: table.title, t: 's' };

    table.columns.forEach((col, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: 1, c: currentCol + colIdx });
      ws[cell] = { v: col.label, t: 's' };

      let maxLen = col.label.length;
      table.rows.forEach(row => {
        const cellLen = String(row[col.key] ?? '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      allColWidths[currentCol + colIdx] = { wch: Math.max(maxLen + 2, 10) };
    });

    table.rows.forEach((row, rowIdx) => {
      table.columns.forEach((col, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: rowIdx + 2, c: currentCol + colIdx });
        const val = row[col.key];
        if (typeof val === 'number') {
          ws[cell] = { v: val, t: 'n' };
        } else {
          ws[cell] = { v: val ?? '', t: 's' };
        }
      });
    });

    if (table.totals) {
      const totRow = table.rows.length + 2;
      table.columns.forEach((col, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: totRow, c: currentCol + colIdx });
        if (table.totals![col.key] !== undefined) {
          ws[cell] = { v: table.totals![col.key], t: 'n' };
        } else if (colIdx === 0) {
          ws[cell] = { v: 'TOTAL', t: 's' };
        }
      });
      maxRows = Math.max(maxRows, table.rows.length + 3);
    } else {
      maxRows = Math.max(maxRows, table.rows.length + 2);
    }

    currentCol += table.columns.length + 2;

    if (tableIndex < tables.length - 1) {
      allColWidths[currentCol - 2] = { wch: 3 };
      allColWidths[currentCol - 1] = { wch: 3 };
    }
  });

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxRows, c: currentCol - 1 }
  });

  ws['!cols'] = allColWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Combined Export');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export function exportCombined(tables: ExportTableData[]): void {
  const date = new Date().toISOString().split('T')[0];
  exportMultiTableSideBySide(tables, `Combined_Export_${date}`);
}

// Helper
function formatNumber(val: number): string {
  return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
