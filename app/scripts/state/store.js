import { calculateTotals } from '../domain/billing.js';
import {
  bootstrapAppData,
  persistTables,
  persistSettings,
  persistMenu,
  appendBillHistory,
  wipeBillHistory,
  replaceStoredBillHistory,
  replaceAppSnapshot,
  DEFAULT_SETTINGS,
  buildDefaultTables,
  writeRecoverySnapshot,
} from '../data/repository.js';
import { slugify } from '../utils/format.js';

const listeners = new Set();

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function monthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function previousMonthValue() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return monthValue(date);
}

const state = {
  view: 'floor',
  tables: [],
  menu: [],
  settings: { ...DEFAULT_SETTINGS },
  billHistory: [],
  selectedTableId: null,
  selectedMenuEditorId: null,
  category: 'All',
  floorFilter: 'all',
  search: '',
  moveOrderFromTableId: null,
  activeReceipt: null,
  statusMessage: 'Preparing your floor...',
  analytics: {
    historyDate: todayValue(),
    compareDayA: todayValue(),
    compareDayB: todayValue(),
    compareMonthA: monthValue(),
    compareMonthB: previousMonthValue(),
    dishId: 'all',
  },
  ready: false,
};

let persistenceQueue = Promise.resolve();

function cloneState() {
  return structuredClone(state);
}

function emit() {
  const snapshot = cloneState();
  listeners.forEach((listener) => listener(snapshot));
}

function updateStatus(message) {
  state.statusMessage = message;
}

function getTable(tableId = state.selectedTableId) {
  return state.tables.find((table) => table.id === tableId) ?? null;
}

function getMenuItem(itemId = state.selectedMenuEditorId) {
  return state.menu.find((item) => item.id === itemId) ?? null;
}

function ensureOrder(table) {
  if (!table.order) {
    table.order = {
      id: `order-${table.id}-${Date.now()}`,
      tableId: table.id,
      tableName: table.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      discount: Number(state.settings.defaultDiscount ?? 0),
      paymentMode: 'Cash',
      items: [],
    };
  }
  return table.order;
}

function hasRestaurantSetup() {
  return Boolean(state.settings.restaurantName.trim());
}

function defaultSeatsForIndex(index) {
  return index < 6 ? 4 : 6;
}

function normalizeSettings(nextSettings = {}) {
  const current = state.settings;
  const merged = { ...current, ...nextSettings };
  const normalized = {
    ...merged,
    restaurantName: String(merged.restaurantName || '').trim(),
    receiptFooter: String(merged.receiptFooter || '').trim(),
    serviceChargeRate: Object.prototype.hasOwnProperty.call(nextSettings, 'serviceChargeRate')
      ? Math.max(0, Number(nextSettings.serviceChargeRate) || 0)
      : Math.max(0, Number(current.serviceChargeRate) || 0),
    gstEnabled: Object.prototype.hasOwnProperty.call(nextSettings, 'gstEnabled')
      ? Boolean(nextSettings.gstEnabled)
      : Boolean(current.gstEnabled),
    gstRate: Object.prototype.hasOwnProperty.call(nextSettings, 'gstRate')
      ? Math.max(0, Number(nextSettings.gstRate) || 0)
      : Math.max(0, Number(current.gstRate) || 0),
    gstNumber: String(merged.gstNumber || current.gstNumber || '').trim().toUpperCase(),
    defaultDiscount: Object.prototype.hasOwnProperty.call(nextSettings, 'defaultDiscount')
      ? Math.max(0, Number(nextSettings.defaultDiscount) || 0)
      : Math.max(0, Number(current.defaultDiscount) || 0),
    glassMode: merged.glassMode === 'clear' ? 'clear' : 'soft',
    themeMode: merged.themeMode === 'dark' ? 'dark' : 'light',
    autoPrintOnClose: Object.prototype.hasOwnProperty.call(nextSettings, 'autoPrintOnClose')
      ? Boolean(nextSettings.autoPrintOnClose)
      : Boolean(current.autoPrintOnClose),
    preferredPrinterAddress: String(merged.preferredPrinterAddress || current.preferredPrinterAddress || ''),
    preferredPrinterName: String(merged.preferredPrinterName || current.preferredPrinterName || ''),
    floorCardMode: merged.floorCardMode === 'compact' ? 'compact' : 'detail',
    restaurantLogoDataUrl: String(merged.restaurantLogoDataUrl || ''),
    setupCompletedAt: String(merged.setupCompletedAt || current.setupCompletedAt || ''),
    tableCount: Object.prototype.hasOwnProperty.call(nextSettings, 'tableCount')
      ? Math.max(1, Number(nextSettings.tableCount) || 1)
      : Math.max(1, Number(current.tableCount) || DEFAULT_SETTINGS.tableCount),
  };

  if (normalized.gstEnabled && !normalized.gstNumber) {
    throw new Error('GST number is required when GST is enabled.');
  }

  return normalized;
}

function normalizeMenuDraft(draft, existingId = '') {
  const code = String(draft.code || '').trim();
  const name = String(draft.name || '').trim();
  const category = String(draft.category || '').trim();
  const note = String(draft.note || '').trim();
  const type = draft.type === 'nonveg' ? 'nonveg' : 'veg';
  const price = Math.max(0, Number(draft.price) || 0);
  if (!name || !code || !category) {
    throw new Error('Dish code, name, and category are required.');
  }

  return {
    id: existingId || slugify(`${name}-${code}`),
    code,
    name,
    category,
    note,
    type,
    price,
  };
}

function buildRuntimeSnapshot() {
  return {
    settings: structuredClone(state.settings),
    menu: structuredClone(state.menu),
    tables: structuredClone(state.tables),
    billHistory: structuredClone(state.billHistory),
  };
}

function queuePersistence(work) {
  const snapshot = buildRuntimeSnapshot();
  writeRecoverySnapshot(snapshot);
  persistenceQueue = persistenceQueue
    .catch(() => undefined)
    .then(() => work(snapshot))
    .catch((error) => {
      console.error(error);
      updateStatus('Local save failed. Your last change is kept in recovery data.');
      emit();
      throw error;
    });
  return persistenceQueue;
}

async function saveTables() {
  await queuePersistence((snapshot) => persistTables(snapshot.tables));
}

async function saveSettingsOnly() {
  await queuePersistence((snapshot) => persistSettings(snapshot.settings));
}

async function saveMenu() {
  await queuePersistence((snapshot) => persistMenu(snapshot.menu));
}

function getNumberedTables() {
  return state.tables
    .filter((table) => table.id !== 'counter')
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function resizeTables(nextCount) {
  const target = Math.max(1, Number(nextCount) || 1);
  const numberedTables = getNumberedTables();
  const removedTables = numberedTables.slice(target);
  const occupiedRemoved = removedTables.filter((table) => table.order?.items?.length);
  if (occupiedRemoved.length) {
    throw new Error(`Cannot reduce tables while active orders exist on ${occupiedRemoved.map((table) => table.name).join(', ')}.`);
  }

  const fallback = buildDefaultTables(target).filter((table) => table.id !== 'counter');
  const resized = Array.from({ length: target }, (_, index) => {
    const existing = numberedTables[index];
    const base = fallback[index];
    return {
      id: `table-${index + 1}`,
      name: `Table ${index + 1}`,
      seats: existing ? Math.max(1, Number(existing.seats) || defaultSeatsForIndex(index)) : base.seats,
      order: existing?.order ?? null,
      updatedAt: new Date().toISOString(),
    };
  });

  const counter = getTable('counter') ?? {
    id: 'counter',
    name: 'Walk-In',
    seats: 2,
    order: null,
    updatedAt: new Date().toISOString(),
  };

  state.tables = [
    ...resized,
    {
      ...counter,
      id: 'counter',
      name: 'Walk-In',
      seats: 2,
      updatedAt: new Date().toISOString(),
    },
  ];

  if (state.selectedTableId && !state.tables.some((table) => table.id === state.selectedTableId)) {
    state.selectedTableId = null;
  }
}

export async function flushPersistence() {
  await queuePersistence((snapshot) => Promise.all([
    persistTables(snapshot.tables),
    persistSettings(snapshot.settings),
    persistMenu(snapshot.menu),
  ]));
}

export async function initializeStore() {
  const data = await bootstrapAppData();
  state.tables = data.tables;
  state.menu = data.menu;
  state.settings = data.settings;
  state.billHistory = data.billHistory;
  state.ready = true;
  state.selectedMenuEditorId = state.menu[0]?.id ?? null;
  updateStatus(hasRestaurantSetup()
    ? 'Local floor ready. Every order change is saved on this device.'
    : 'Complete restaurant setup to unlock the floor and printing experience.');
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(cloneState());
  return () => listeners.delete(listener);
}

export function setView(view) {
  state.view = view;
  updateStatus(view === 'summary'
    ? 'Daily and comparative analytics are computed from local bill history.'
    : view === 'settings'
      ? 'Restaurant setup, billing rules, floor plan, and menu edits are stored locally.'
      : state.moveOrderFromTableId
        ? 'Select an empty table to move the active order.'
        : 'Tap a table to continue service.');
  emit();
}

export function setSearch(search) {
  state.search = search.trim();
  emit();
}

export function setCategory(category) {
  state.category = category;
  emit();
}

export function setFloorFilter(filter) {
  state.floorFilter = filter;
  emit();
}

export function setHistoryDate(value) {
  state.analytics.historyDate = value || todayValue();
  emit();
}

export function setCompareDayA(value) {
  state.analytics.compareDayA = value || todayValue();
  emit();
}

export function setCompareDayB(value) {
  state.analytics.compareDayB = value || todayValue();
  emit();
}

export function setCompareMonthA(value) {
  state.analytics.compareMonthA = value || monthValue();
  emit();
}

export function setCompareMonthB(value) {
  state.analytics.compareMonthB = value || previousMonthValue();
  emit();
}

export function setAnalyticsDish(dishId) {
  state.analytics.dishId = dishId || 'all';
  emit();
}

export function resetAnalyticsFilters() {
  state.analytics = {
    historyDate: todayValue(),
    compareDayA: todayValue(),
    compareDayB: todayValue(),
    compareMonthA: monthValue(),
    compareMonthB: previousMonthValue(),
    dishId: 'all',
  };
  state.activeReceipt = null;
  updateStatus('Analytics filters reset to today and current month defaults.');
  emit();
}

export function openWalkIn() {
  state.view = 'floor';
  state.selectedTableId = 'counter';
  updateStatus('Walk-in order ready. Add items from the menu panel.');
  emit();
}

export function selectTable(tableId) {
  if (state.moveOrderFromTableId) {
    void moveSelectedOrder(tableId);
    return;
  }

  state.selectedTableId = tableId;
  const table = getTable(tableId);
  updateStatus(table?.order?.items?.length ? `${table.name} reopened from local draft.` : `${table?.name ?? 'Table'} is ready for a new order.`);
  emit();
}

export function closeDrawer() {
  state.selectedTableId = null;
  emit();
}

export function startMoveOrder(tableId) {
  const table = getTable(tableId);
  if (!table?.order?.items?.length) {
    updateStatus('Only occupied tables can be moved.');
    emit();
    return;
  }

  state.moveOrderFromTableId = tableId;
  state.view = 'floor';
  state.selectedTableId = null;
  updateStatus(`Move mode active for ${table.name}. Tap an empty destination table.`);
  emit();
}

export function clearMoveOrder() {
  state.moveOrderFromTableId = null;
  updateStatus('Move mode cleared.');
  emit();
}

async function moveSelectedOrder(targetTableId) {
  const source = getTable(state.moveOrderFromTableId);
  const target = getTable(targetTableId);
  if (!source || !target) return;
  if (target.order?.items?.length) {
    updateStatus(`${target.name} already has an active order. Choose an empty table.`);
    emit();
    return;
  }

  target.order = {
    ...source.order,
    tableId: target.id,
    tableName: target.name,
    updatedAt: new Date().toISOString(),
  };
  source.order = null;
  state.moveOrderFromTableId = null;
  state.selectedTableId = target.id;
  await saveTables();
  updateStatus(`Order moved from ${source.name} to ${target.name}.`);
  emit();
}

export async function addItemToTable(tableId, menuItem) {
  const table = getTable(tableId);
  if (!table) return;

  const order = ensureOrder(table);
  const existing = order.items.find((item) => item.id === menuItem.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    order.items.push({
      id: menuItem.id,
      code: menuItem.code,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      type: menuItem.type,
      quantity: 1,
    });
  }
  order.updatedAt = new Date().toISOString();
  await saveTables();
  updateStatus(`${menuItem.name} added to ${table.name}.`);
  emit();
}

export async function updateItemQuantity(tableId, itemId, delta) {
  const table = getTable(tableId);
  const order = table?.order;
  if (!order) return;

  const item = order.items.find((entry) => entry.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    order.items = order.items.filter((entry) => entry.id !== itemId);
  }
  order.updatedAt = new Date().toISOString();
  if (!order.items.length) {
    table.order = null;
  }
  await saveTables();
  updateStatus(delta > 0 ? `${item.name} quantity increased.` : `${item.name} quantity updated.`);
  emit();
}

export async function setDiscount(discount) {
  const table = getTable();
  if (!table?.order) return;
  table.order.discount = Math.max(0, Number(discount) || 0);
  table.order.updatedAt = new Date().toISOString();
  await saveTables();
  emit();
}

export async function setPaymentMode(paymentMode) {
  const table = getTable();
  if (!table?.order) return;
  table.order.paymentMode = paymentMode;
  table.order.updatedAt = new Date().toISOString();
  await saveTables();
  emit();
}

export async function saveSettings(nextSettings) {
  const nextNormalized = normalizeSettings(nextSettings);
  const previousTableCount = state.settings.tableCount;
  state.settings = nextNormalized;

  if (nextNormalized.tableCount !== previousTableCount) {
    resizeTables(nextNormalized.tableCount);
  }

  await queuePersistence((snapshot) => Promise.all([
    persistSettings(snapshot.settings),
    persistTables(snapshot.tables),
  ]));
  updateStatus('Restaurant settings and floor plan saved locally on this device.');
  emit();
}

export async function completeRestaurantSetup(setupValues) {
  const nextSettings = normalizeSettings({
    ...setupValues,
    setupCompletedAt: state.settings.setupCompletedAt || new Date().toISOString(),
  });
  if (!nextSettings.restaurantName) {
    throw new Error('Restaurant name is required to complete setup.');
  }
  state.settings = nextSettings;
  if (getNumberedTables().length !== nextSettings.tableCount) {
    resizeTables(nextSettings.tableCount);
  }
  await queuePersistence((snapshot) => Promise.all([
    persistSettings(snapshot.settings),
    persistTables(snapshot.tables),
  ]));
  updateStatus(`${state.settings.restaurantName} is ready for service.`);
  emit();
}

export function selectMenuEditorItem(itemId) {
  state.selectedMenuEditorId = itemId;
  state.view = 'settings';
  updateStatus('Dish editor is ready. Changes stay local until you save.');
  emit();
}

export function startMenuItemCreation() {
  state.selectedMenuEditorId = null;
  state.view = 'settings';
  updateStatus('Create a new dish for this workstation.');
  emit();
}

export async function saveMenuItemDraft(draft) {
  const existingItem = getMenuItem();
  const normalized = normalizeMenuDraft(draft, existingItem?.id || '');
  const duplicateCode = state.menu.find((item) => item.code === normalized.code && item.id !== normalized.id);
  if (duplicateCode) {
    throw new Error(`Dish code ${normalized.code} already exists.`);
  }

  if (existingItem) {
    state.menu = state.menu.map((item) => item.id === existingItem.id ? normalized : item);
    updateStatus(`${normalized.name} updated in the local menu.`);
  } else {
    state.menu = [...state.menu, normalized].sort((a, b) => a.code.localeCompare(b.code));
    updateStatus(`${normalized.name} added to the local menu.`);
  }

  state.selectedMenuEditorId = normalized.id;
  await saveMenu();
  emit();
}

export async function deleteMenuItem(itemId = state.selectedMenuEditorId) {
  const menuItem = getMenuItem(itemId);
  if (!menuItem) return;
  const usedInOpenOrders = state.tables.some((table) => table.order?.items?.some((item) => item.id === menuItem.id));
  if (usedInOpenOrders) {
    throw new Error('This dish is part of an active order. Remove it from open orders first.');
  }

  state.menu = state.menu.filter((item) => item.id !== menuItem.id);
  state.selectedMenuEditorId = state.menu[0]?.id ?? null;
  await saveMenu();
  updateStatus(`${menuItem.name} removed from the local menu.`);
  emit();
}

function buildReceipt(order, totals) {
  return {
    id: `bill-${Date.now()}`,
    tableId: order.tableId,
    tableName: order.tableName,
    paymentMode: order.paymentMode,
    items: structuredClone(order.items),
    totals,
    settings: { ...state.settings },
    closedAt: new Date().toISOString(),
  };
}

export async function checkoutSelectedTable() {
  const table = getTable();
  if (!table?.order?.items?.length) {
    updateStatus('Add items before closing a bill.');
    emit();
    return null;
  }

  const totals = calculateTotals(table.order, state.settings);
  const receipt = buildReceipt(table.order, totals);
  state.billHistory.unshift(receipt);
  state.activeReceipt = receipt;
  table.order = null;
  state.selectedTableId = null;
  await queuePersistence((snapshot) => Promise.all([
    persistTables(snapshot.tables),
    appendBillHistory(receipt),
  ]));
  updateStatus(`${receipt.tableName} closed at ${receipt.paymentMode}. Ready to print or save as PDF.`);
  emit();
  return receipt;
}

export async function saveDraft() {
  const table = getTable();
  if (!table) return;
  await saveTables();
  updateStatus(`${table.name} draft saved locally.`);
  emit();
}

export async function clearHistory() {
  state.billHistory = [];
  state.activeReceipt = null;
  await queuePersistence(() => replaceStoredBillHistory([]));
  updateStatus('Local billing history cleared.');
  emit();
}

export async function clearOpenDrafts() {
  state.tables = state.tables.map((table) => ({
    ...table,
    order: null,
    updatedAt: new Date().toISOString(),
  }));
  state.selectedTableId = null;
  await saveTables();
  updateStatus('All open drafts cleared from this device.');
  emit();
}

export function setActiveReceipt(receiptId) {
  state.activeReceipt = state.billHistory.find((entry) => entry.id === receiptId) ?? null;
  if (state.activeReceipt) {
    updateStatus(`Receipt loaded for ${state.activeReceipt.tableName}.`);
  }
  emit();
}

export function getSelectedOrderSnapshot() {
  const table = getTable();
  if (!table?.order) return null;
  const totals = calculateTotals(table.order, state.settings);
  return buildReceipt(table.order, totals);
}

export function exportSnapshot() {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: structuredClone(state.settings),
    menu: structuredClone(state.menu),
    tables: structuredClone(state.tables),
    billHistory: structuredClone(state.billHistory),
  };
}

export async function importSnapshot(snapshot) {
  const normalized = await replaceAppSnapshot(snapshot);
  state.settings = normalized.settings;
  state.menu = normalized.menu;
  state.tables = normalized.tables;
  state.billHistory = normalized.billHistory.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
  state.selectedTableId = null;
  state.selectedMenuEditorId = state.menu[0]?.id ?? null;
  state.activeReceipt = null;
  state.view = 'floor';
  updateStatus('Backup imported successfully. Local workstation state restored.');
  emit();
}

export function getState() {
  return cloneState();
}


