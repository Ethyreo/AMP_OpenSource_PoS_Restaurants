import {
  getBillHistory,
  getMeta,
  setMeta,
  addBillHistory,
  clearBillHistory,
  replaceBillHistory,
} from './indexeddb.js';
import { slugify } from '../utils/format.js';

const RECOVERY_KEY = 'ken-pos-recovery-v1';

export const DEFAULT_SETTINGS = {
  restaurantName: '',
  receiptFooter: 'Thanks for dining with us.',
  serviceChargeRate: 5,
  gstEnabled: true,
  gstRate: 5,
  gstNumber: '',
  defaultDiscount: 0,
  glassMode: 'soft',
  themeMode: 'light',
  autoPrintOnClose: false,
  preferredPrinterAddress: '',
  preferredPrinterName: '',
  floorCardMode: 'detail',
  restaurantLogoDataUrl: '',
  setupCompletedAt: '',
  tableCount: 12,
};

export const DEFAULT_MENU = [
  { id: slugify('Tomato Basil Soup-001'), code: '001', name: 'Tomato Basil Soup', category: 'Starters', price: 175, type: 'veg', note: 'Velvety bowl with toasted crumbs' },
  { id: slugify('Dahi Kebabs-002'), code: '002', name: 'Dahi Kebabs', category: 'Starters', price: 245, type: 'veg', note: 'Crisp shell, soft center' },
  { id: slugify('Chicken Malai Tikka-003'), code: '003', name: 'Chicken Malai Tikka', category: 'Starters', price: 345, type: 'nonveg', note: 'Creamy skewers from the grill' },
  { id: slugify('Dal Makhani-101'), code: '101', name: 'Dal Makhani', category: 'Mains', price: 295, type: 'veg', note: 'Slow simmered black lentils' },
  { id: slugify('Paneer Lababdar-102'), code: '102', name: 'Paneer Lababdar', category: 'Mains', price: 325, type: 'veg', note: 'Rich tomato-cashew gravy' },
  { id: slugify('Butter Chicken-103'), code: '103', name: 'Butter Chicken', category: 'Mains', price: 395, type: 'nonveg', note: 'House signature' },
  { id: slugify('Garlic Naan-201'), code: '201', name: 'Garlic Naan', category: 'Breads', price: 85, type: 'veg', note: 'Tandoor-baked flatbread' },
  { id: slugify('Steamed Rice-202'), code: '202', name: 'Steamed Rice', category: 'Rice', price: 145, type: 'veg', note: 'Fluffy long grain rice' },
  { id: slugify('Veg Biryani-203'), code: '203', name: 'Veg Biryani', category: 'Rice', price: 305, type: 'veg', note: 'Layered fragrant rice' },
  { id: slugify('Chicken Biryani-204'), code: '204', name: 'Chicken Biryani', category: 'Rice', price: 375, type: 'nonveg', note: 'Dum-cooked classic' },
  { id: slugify('Masala Cola-301'), code: '301', name: 'Masala Cola', category: 'Drinks', price: 120, type: 'veg', note: 'Spiced house cooler' },
  { id: slugify('Cold Coffee-302'), code: '302', name: 'Cold Coffee', category: 'Drinks', price: 165, type: 'veg', note: 'Frothy cafe-style shake' },
  { id: slugify('Baked Gulab Jamun-401'), code: '401', name: 'Baked Gulab Jamun', category: 'Desserts', price: 155, type: 'veg', note: 'Warm and caramelized' },
];

function defaultSeatsForIndex(index) {
  return index < 6 ? 4 : 6;
}

export function buildDefaultTables(tableCount = DEFAULT_SETTINGS.tableCount) {
  const total = Math.max(1, Number(tableCount) || DEFAULT_SETTINGS.tableCount);
  return Array.from({ length: total }, (_, index) => ({
    id: `table-${index + 1}`,
    name: `Table ${index + 1}`,
    seats: defaultSeatsForIndex(index),
    order: null,
    updatedAt: new Date().toISOString(),
  })).concat({
    id: 'counter',
    name: 'Walk-In',
    seats: 2,
    order: null,
    updatedAt: new Date().toISOString(),
  });
}

function normalizeMenu(menu) {
  if (!Array.isArray(menu) || !menu.length) {
    return structuredClone(DEFAULT_MENU);
  }

  return menu.map((item, index) => ({
    id: item.id || slugify(`${item.name || 'dish'}-${item.code || index}`),
    code: String(item.code || '').trim() || String(index + 1).padStart(3, '0'),
    name: String(item.name || 'Untitled Dish').trim(),
    category: String(item.category || 'General').trim(),
    price: Math.max(0, Number(item.price) || 0),
    type: item.type === 'nonveg' ? 'nonveg' : 'veg',
    note: String(item.note || '').trim(),
  })).sort((a, b) => a.code.localeCompare(b.code));
}

function normalizeSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
  return {
    ...merged,
    restaurantName: String(merged.restaurantName || '').trim(),
    receiptFooter: String(merged.receiptFooter || DEFAULT_SETTINGS.receiptFooter).trim(),
    serviceChargeRate: Math.max(0, Number(merged.serviceChargeRate) || 0),
    gstEnabled: Boolean(merged.gstEnabled),
    gstRate: Math.max(0, Number(merged.gstRate) || 0),
    gstNumber: String(merged.gstNumber || '').trim().toUpperCase(),
    defaultDiscount: Math.max(0, Number(merged.defaultDiscount) || 0),
    glassMode: merged.glassMode === 'clear' ? 'clear' : 'soft',
    themeMode: merged.themeMode === 'dark' ? 'dark' : 'light',
    autoPrintOnClose: Boolean(merged.autoPrintOnClose),
    preferredPrinterAddress: String(merged.preferredPrinterAddress || ''),
    preferredPrinterName: String(merged.preferredPrinterName || ''),
    floorCardMode: merged.floorCardMode === 'compact' ? 'compact' : 'detail',
    restaurantLogoDataUrl: String(merged.restaurantLogoDataUrl || ''),
    setupCompletedAt: String(merged.setupCompletedAt || ''),
    tableCount: Math.max(1, Number(merged.tableCount) || DEFAULT_SETTINGS.tableCount),
  };
}

function normalizeTables(tables, tableCount) {
  if (!Array.isArray(tables) || !tables.length) {
    return buildDefaultTables(tableCount);
  }

  const numberedTables = tables
    .filter((table) => table.id !== 'counter')
    .map((table, index) => ({
      id: table.id || `table-${index + 1}`,
      name: table.name || `Table ${index + 1}`,
      seats: Math.max(1, Number(table.seats) || defaultSeatsForIndex(index)),
      order: table.order ?? null,
      updatedAt: table.updatedAt || new Date().toISOString(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const counter = tables.find((table) => table.id === 'counter') ?? {
    id: 'counter',
    name: 'Walk-In',
    seats: 2,
    order: null,
    updatedAt: new Date().toISOString(),
  };

  if (!numberedTables.length) {
    return buildDefaultTables(tableCount);
  }

  return [
    ...numberedTables,
    {
      id: 'counter',
      name: counter.name || 'Walk-In',
      seats: Math.max(1, Number(counter.seats) || 2),
      order: counter.order ?? null,
      updatedAt: counter.updatedAt || new Date().toISOString(),
    },
  ];
}

function readRecoverySnapshot() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RECOVERY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeRecoverySnapshot(snapshot) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(RECOVERY_KEY, JSON.stringify({
      version: 2,
      updatedAt: new Date().toISOString(),
      settings: snapshot.settings,
      menu: snapshot.menu,
      tables: snapshot.tables,
      billHistory: snapshot.billHistory,
    }));
  } catch {
    // Best-effort crash journal; ignore quota failures.
  }
}

export function clearRecoverySnapshot() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(RECOVERY_KEY);
  } catch {
    // ignore
  }
}

export async function bootstrapAppData() {
  const [tables, settings, menu, billHistory] = await Promise.all([
    getMeta('tables'),
    getMeta('settings'),
    getMeta('menu'),
    getBillHistory(),
  ]);

  const recovery = readRecoverySnapshot();
  const normalizedSettings = normalizeSettings(recovery?.settings ?? settings);
  const normalizedMenu = normalizeMenu(recovery?.menu ?? menu);
  const normalizedTables = normalizeTables(recovery?.tables ?? tables, normalizedSettings.tableCount);
  const normalizedHistory = Array.isArray(recovery?.billHistory) ? recovery.billHistory : billHistory;

  return {
    tables: normalizedTables,
    settings: normalizedSettings,
    menu: normalizedMenu,
    billHistory: normalizedHistory,
  };
}

export function persistTables(tables) {
  return setMeta('tables', tables);
}

export function persistSettings(settings) {
  return setMeta('settings', normalizeSettings(settings));
}

export function persistMenu(menu) {
  return setMeta('menu', normalizeMenu(menu));
}

export function appendBillHistory(record) {
  return addBillHistory(record);
}

export function replaceStoredBillHistory(records) {
  return replaceBillHistory(records);
}

export function wipeBillHistory() {
  return clearBillHistory();
}

export async function replaceAppSnapshot(snapshot) {
  const settings = normalizeSettings(snapshot.settings);
  const tables = normalizeTables(snapshot.tables, settings.tableCount);
  const menu = normalizeMenu(snapshot.menu);
  const billHistory = Array.isArray(snapshot.billHistory) ? snapshot.billHistory : [];

  await Promise.all([
    setMeta('tables', tables),
    setMeta('settings', settings),
    setMeta('menu', menu),
    replaceBillHistory(billHistory),
  ]);

  writeRecoverySnapshot({ settings, tables, menu, billHistory });

  return {
    settings,
    tables,
    menu,
    billHistory,
  };
}


