// ============================================================
// EXCEL EXPORT SERVICE — Enhanced Production Version
// ============================================================

import * as XLSX from 'xlsx';
import {
  ColumnConfig,
} from '@/config/DynamicColumnConfig';

export interface ExportTableData {
  title: string;
  columns: ColumnConfig[];
  rows: Record<string, any>[];
  totals?: Record<string, number>;
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
      if (val === undefined || val === null) return '';
      return val;
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

  // Apply column widths and number formats
  ws['!cols'] = tableData.columns.map((col, i) => {
    let maxLen = col.label.length;
    dataRows.forEach(row => {
      const cellLen = String(row[i] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
  });

  // Apply number formats to currency columns
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const colConfig = tableData.columns[C];
    if (colConfig?.format === 'currency') {
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[address]) continue;
        ws[address].t = 'n';
        ws[address].z = '₹#,##0.00'; // Indian Rupee Format
      }
    }
  }

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

  tables.forEach((table) => {
    // Title row
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: currentCol });
    ws[titleCell] = { v: table.title.toUpperCase(), t: 's' };

    // Header row
    table.columns.forEach((col, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: 1, c: currentCol + colIdx });
      ws[cell] = { v: col.label, t: 's' };

      let maxLen = col.label.length;
      table.rows.forEach(row => {
        const cellLen = String(row[col.key] ?? '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      allColWidths[currentCol + colIdx] = { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
    });

    // Data rows
    table.rows.forEach((row, rowIdx) => {
      table.columns.forEach((col, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: rowIdx + 2, c: currentCol + colIdx });
        const val = row[col.key];
        
        if (typeof val === 'number') {
          ws[cell] = { v: val, t: 'n' };
          if (col.format === 'currency') {
            ws[cell].z = '₹#,##0.00';
          }
        } else {
          ws[cell] = { v: val ?? '', t: 's' };
        }
      });
    });

    // Totals row
    if (table.totals) {
      const totRowIdx = table.rows.length + 2;
      table.columns.forEach((col, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: totRowIdx, c: currentCol + colIdx });
        if (table.totals![col.key] !== undefined) {
          ws[cell] = { v: table.totals![col.key], t: 'n' };
          if (col.format === 'currency') ws[cell].z = '₹#,##0.00';
        } else if (colIdx === 0) {
          ws[cell] = { v: 'TOTAL', t: 's' };
        }
      });
      maxRows = Math.max(maxRows, table.rows.length + 3);
    } else {
      maxRows = Math.max(maxRows, table.rows.length + 2);
    }

    currentCol += table.columns.length + 2;
    allColWidths[currentCol - 2] = { wch: 4 }; // Spacer
    allColWidths[currentCol - 1] = { wch: 4 }; // Spacer
  });

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxRows, c: Math.max(0, currentCol - 3) }
  });

  ws['!cols'] = allColWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Combined Reports');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export function exportCombined(tables: ExportTableData[]): void {
  const date = new Date().toISOString().split('T')[0];
  exportMultiTableSideBySide(tables, `Financial_Reports_${date}`);
}

// Legacy support (keeping if needed but usually better to use generic exportSingleTable)
export function exportQuotationWithHeader(header: any, rows: any[]): void {
  exportSingleTable({
    title: 'Quotation',
    columns: require('@/config/DynamicColumnConfig').QUOTATION_COLUMNS,
    rows: rows
  }, 'Quotation_Export');
}
