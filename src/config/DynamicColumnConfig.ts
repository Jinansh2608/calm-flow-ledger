// ============================================================
// DYNAMIC COLUMN CONFIGURATION
// Client 2 BOQ-style quotation format with GST Support
// ============================================================

export type ColumnAlignment = 'left' | 'right' | 'center';
export type ColumnInputType = 'text' | 'number' | 'dropdown' | 'searchable' | 'readonly' | 'percentage';

export interface ColumnConfig {
  key: string;
  label: string;
  width: number; // min-width in px
  alignment: ColumnAlignment;
  inputType: ColumnInputType;
  required?: boolean;
  editable?: boolean;
  autoCalculated?: boolean;
  defaultValue?: string | number;
  dropdownOptions?: string[];
  format?: 'currency' | 'percentage' | 'number' | 'text';
}

// ============================================================
// QUOTATION HEADER FIELDS
// ============================================================
export interface QuotationHeader {
  storeId: string;          // Field 0: Store ID
  storeLocation: string;    // Field 1: Store Location / Address Line 1
  fullAddress: string;      // Field 2: Full Address Line 2
  companyName: string;      // Field 3: Company Name
  totalArea: string;        // Field 4: Total Area / Quantity Reference
}

export const EMPTY_QUOTATION_HEADER: QuotationHeader = {
  storeId: '',
  storeLocation: '',
  fullAddress: '',
  companyName: '',
  totalArea: '',
};

// ============================================================
// CLIENT 2 BOQ GRID COLUMNS — Restored GST Support
// ============================================================
export const QUOTATION_COLUMNS: ColumnConfig[] = [
  {
    key: 'name',
    label: 'Name',
    width: 220,
    alignment: 'left',
    inputType: 'searchable',
    required: true,
    editable: true,
  },
  {
    key: 'hsn_sac_code',
    label: 'HSN/SAC',
    width: 100,
    alignment: 'left',
    inputType: 'text',
    editable: true,
  },
  {
    key: 'type_of_boq',
    label: 'Type',
    width: 120,
    alignment: 'left',
    inputType: 'dropdown',
    editable: true,
    dropdownOptions: ['Movable', 'Non Movable'],
  },
  {
    key: 'quantity',
    label: 'Qty',
    width: 80,
    alignment: 'right',
    inputType: 'number',
    editable: true,
    defaultValue: 1,
    format: 'number',
  },
  {
    key: 'units',
    label: 'Units',
    width: 90,
    alignment: 'left',
    inputType: 'dropdown',
    editable: true,
    dropdownOptions: ['Nos', 'Sqft', 'Rft', 'Kg', 'Ltr', 'Set', 'Pair', 'Lot', 'Box', 'Pcs', 'Mtr'],
  },
  {
    key: 'price',
    label: 'Price',
    width: 100,
    alignment: 'right',
    inputType: 'number',
    editable: true,
    defaultValue: 0,
    format: 'currency',
  },
  {
    key: 'tax',
    label: 'Tax %',
    width: 80,
    alignment: 'right',
    inputType: 'percentage',
    editable: true,
    defaultValue: 18,
    format: 'percentage',
  },
  {
    key: 'total',
    label: 'Total (Incl. GST)',
    width: 140,
    alignment: 'right',
    inputType: 'readonly',
    editable: false,
    format: 'currency',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getQuotationColumns(): ColumnConfig[] {
  return QUOTATION_COLUMNS;
}

export function createEmptyRow(index?: number): Record<string, any> {
  const row: Record<string, any> = { _id: crypto.randomUUID() };

  QUOTATION_COLUMNS.forEach(col => {
    if (col.defaultValue !== undefined) {
      row[col.key] = col.defaultValue;
    } else {
      row[col.key] = '';
    }
  });

  return row;
}

/**
 * Row calculation with GST Support
 */
export function calculateRowTotals(row: Record<string, any>): {
  rowTotal: number;
  rowGST: number;
  rowGrand: number;
} {
  const qty = Number(row.quantity) || 0;
  const price = Number(row.price) || 0;
  const tax = Number(row.tax) || 0;

  const rowTotal = qty * price;
  const rowGST = rowTotal * (tax / 100);
  const rowGrand = rowTotal + rowGST;

  return { rowTotal, rowGST, rowGrand };
}

/**
 * Grand total calculations with GST Support
 */
export function getGrandTotals(rows: Record<string, any>[]): {
  subtotal: number;
  totalGST: number;
  finalAmount: number;
} {
  let subtotal = 0;
  let totalGST = 0;

  rows.forEach(row => {
    const { rowTotal, rowGST } = calculateRowTotals(row);
    subtotal += rowTotal;
    totalGST += rowGST;
  });

  return {
    subtotal,
    totalGST,
    finalAmount: subtotal + totalGST,
  };
}

/**
 * Validate quotation header fields
 */
export function validateHeader(header: QuotationHeader): string[] {
  const errors: string[] = [];
  if (!header.storeId.trim()) errors.push('Store ID is required');
  if (!header.storeLocation.trim()) errors.push('Store Location is required');
  if (!header.fullAddress.trim()) errors.push('Full Address is required');
  if (!header.companyName.trim()) errors.push('Company Name is required');
  if (!header.totalArea.trim()) errors.push('Total Area is required');
  return errors;
}

/**
 * Validate line items
 */
export function validateLineItems(rows: Record<string, any>[]): string[] {
  const errors: string[] = [];

  if (rows.length === 0) {
    errors.push('At least one line item is required');
    return errors;
  }

  rows.forEach((row, idx) => {
    const num = idx + 1;
    if (!row.name || !row.name.trim()) {
      errors.push(`Row ${num}: Name is required`);
    }
    const qty = Number(row.quantity);
    if (!qty || qty <= 0) {
      errors.push(`Row ${num}: Quantity must be greater than 0`);
    }
    const price = Number(row.price);
    if (price === undefined || price === null || isNaN(price) || price < 0) {
      errors.push(`Row ${num}: Price must be a valid number`);
    }
  });

  return errors;
}

// ============================================================
// SAMPLE ITEMS FOR AUTOFILL (GST RESTORED)
// ============================================================
export interface SystemItem {
  id: string;
  name: string;
  hsn_sac_code?: string;
  type_of_boq?: string;
  units?: string;
  price?: number;
  tax?: number;
}

export const SAMPLE_ITEMS: SystemItem[] = [
  { id: '1', name: 'Interior Design Consultation', hsn_sac_code: '998311', type_of_boq: 'Non Movable', units: 'Nos', price: 15000, tax: 18 },
  { id: '2', name: 'False Ceiling - Gypsum Board', hsn_sac_code: '6809', type_of_boq: 'Non Movable', units: 'Sqft', price: 85, tax: 18 },
  { id: '3', name: 'Modular Kitchen Cabinet', hsn_sac_code: '9403', type_of_boq: 'Movable', units: 'Set', price: 125000, tax: 18 },
  { id: '4', name: 'Wallpaper Installation', hsn_sac_code: '4814', type_of_boq: 'Non Movable', units: 'Sqft', price: 45, tax: 18 },
  { id: '5', name: 'Electrical Wiring - Concealed', hsn_sac_code: '8544', type_of_boq: 'Non Movable', units: 'Rft', price: 120, tax: 18 },
  { id: '6', name: 'Plumbing - CP Fittings', hsn_sac_code: '8481', type_of_boq: 'Non Movable', units: 'Set', price: 8500, tax: 18 },
  { id: '7', name: 'Wooden Flooring - Laminate', hsn_sac_code: '4411', type_of_boq: 'Non Movable', units: 'Sqft', price: 155, tax: 18 },
  { id: '8', name: 'Paint - Asian Premium Emulsion', hsn_sac_code: '3209', type_of_boq: 'Non Movable', units: 'Sqft', price: 35, tax: 18 },
  { id: '9', name: 'Glass Partition - Toughened', hsn_sac_code: '7007', type_of_boq: 'Non Movable', units: 'Sqft', price: 450, tax: 18 },
  { id: '10', name: 'HVAC Installation', hsn_sac_code: '8415', type_of_boq: 'Non Movable', units: 'Nos', price: 45000, tax: 18 },
  { id: '11', name: 'Fire Safety System', hsn_sac_code: '8424', type_of_boq: 'Non Movable', units: 'Lot', price: 75000, tax: 18 },
  { id: '12', name: 'Furniture - Executive Desk', hsn_sac_code: '9403', type_of_boq: 'Movable', units: 'Nos', price: 35000, tax: 18 },
  { id: '13', name: 'Office Chair - Ergonomic', hsn_sac_code: '9401', type_of_boq: 'Movable', units: 'Nos', price: 18000, tax: 18 },
  { id: '14', name: 'Sofa Set - 3 Seater', hsn_sac_code: '9401', type_of_boq: 'Movable', units: 'Set', price: 55000, tax: 18 },
  { id: '15', name: 'Wardrobe - Built-in', hsn_sac_code: '9403', type_of_boq: 'Non Movable', units: 'Nos', price: 85000, tax: 18 },
];
