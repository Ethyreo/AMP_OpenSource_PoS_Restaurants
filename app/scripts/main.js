import {
  initializeStore,
  subscribe,
  setView,
  setSearch,
  setCategory,
  setFloorFilter,
  setHistoryDate,
  setCompareDayA,
  setCompareDayB,
  setCompareMonthA,
  setCompareMonthB,
  setAnalyticsDish,
  resetAnalyticsFilters,
  openWalkIn,
  selectTable,
  closeDrawer,
  startMoveOrder,
  clearMoveOrder,
  addItemToTable,
  updateItemQuantity,
  setDiscount,
  setPaymentMode,
  saveSettings,
  completeRestaurantSetup,
  checkoutSelectedTable,
  saveDraft,
  clearHistory,
  clearOpenDrafts,
  setActiveReceipt,
  getSelectedOrderSnapshot,
  exportSnapshot,
  importSnapshot,
  getState,
  selectMenuEditorItem,
  startMenuItemCreation,
  saveMenuItemDraft,
  deleteMenuItem,
  addMenuCategory,
  removeMenuCategory,
  closeMenuEditor,
  flushPersistence,
} from './state/store.js';
import { renderApp } from './ui/render.js';

const AUTO_BACKUP_KEY = 'ken-pos-last-external-backup-at';
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BACKUP_CHECK_INTERVAL_MS = 60 * 60 * 1000;

const refs = {
  viewTitle: document.getElementById('viewTitle'),
  topbarSignature: document.getElementById('topbarSignature'),
  statusBar: document.getElementById('statusBar'),
  shiftSnapshot: document.getElementById('shiftSnapshot'),
  tableGrid: document.getElementById('tableGrid'),
  menuList: document.getElementById('menuList'),
  toggleMenuCardModeButton: document.getElementById('toggleMenuCardModeButton'),
  categoryChips: document.getElementById('categoryChips'),
  floorFilters: document.getElementById('floorFilters'),
  floorSnapshot: document.getElementById('floorSnapshot'),
  orderDrawer: document.getElementById('orderDrawer'),
  drawerMenuTabButton: document.getElementById('drawerMenuTabButton'),
  drawerBillTabButton: document.getElementById('drawerBillTabButton'),
  drawerMenuSection: document.getElementById('drawerMenuSection'),
  drawerBillSection: document.getElementById('drawerBillSection'),
  drawerTitle: document.getElementById('drawerTitle'),
  orderMeta: document.getElementById('orderMeta'),
  orderItems: document.getElementById('orderItems'),
  billingSummary: document.getElementById('billingSummary'),
  discountInput: document.getElementById('discountInput'),
  paymentModeSelect: document.getElementById('paymentModeSelect'),
  floorHeroRestaurantName: document.getElementById('floorHeroRestaurantName'),
  floorHeroSubtitle: document.getElementById('floorHeroSubtitle'),
  globalSearch: document.getElementById('globalSearch'),
  settingsForm: document.getElementById('settingsForm'),
  setupForm: document.getElementById('setupForm'),
  summaryCards: document.getElementById('summaryCards'),
  topItems: document.getElementById('topItems'),
  billHistory: document.getElementById('billHistory'),
  paymentSplit: document.getElementById('paymentSplit'),
  dayComparison: document.getElementById('dayComparison'),
  monthComparison: document.getElementById('monthComparison'),
  dishAnalyticsList: document.getElementById('dishAnalyticsList'),
  historyDateInput: document.getElementById('historyDateInput'),
  compareDayAInput: document.getElementById('compareDayAInput'),
  compareDayBInput: document.getElementById('compareDayBInput'),
  compareMonthAInput: document.getElementById('compareMonthAInput'),
  compareMonthBInput: document.getElementById('compareMonthBInput'),
  dishAnalyticsSelect: document.getElementById('dishAnalyticsSelect'),
  backupSnapshot: document.getElementById('backupSnapshot'),
  backupCatalogList: document.getElementById('backupCatalogList'),
  setupGstNumberField: document.getElementById('setupGstNumberField'),
  settingsGstNumberField: document.getElementById('settingsGstNumberField'),
  backupStatusText: document.getElementById('backupStatusText'),
  receiptPrintArea: document.getElementById('receiptPrintArea'),
  receiptPreviewPanel: document.getElementById('receiptPreviewPanel'),
  receiptPreview: document.getElementById('receiptPreview'),
  printSelectedReceiptButton: document.getElementById('printSelectedReceiptButton'),
  closeReceiptPreviewButton: document.getElementById('closeReceiptPreviewButton'),
  createWalkInButton: document.getElementById('createWalkInButton'),
  toggleFloorCardModeButton: document.getElementById('toggleFloorCardModeButton'),
  closeDrawerButton: document.getElementById('closeDrawerButton'),
  holdOrderButton: document.getElementById('holdOrderButton'),
  checkoutButton: document.getElementById('checkoutButton'),
  printReceiptButton: document.getElementById('printReceiptButton'),
  printSummaryButton: document.getElementById('printSummaryButton'),
  resetAnalyticsFiltersButton: document.getElementById('resetAnalyticsFiltersButton'),
  clearHistoryButton: document.getElementById('clearHistoryButton'),
  clearMoveModeButton: document.getElementById('clearMoveModeButton'),
  exportBackupButton: document.getElementById('exportBackupButton'),
  importBackupButton: document.getElementById('importBackupButton'),
  backupFileInput: document.getElementById('backupFileInput'),
  resetDraftsButton: document.getElementById('resetDraftsButton'),
  logoFileInput: document.getElementById('logoFileInput'),
  uploadLogoButton: document.getElementById('uploadLogoButton'),
  clearLogoButton: document.getElementById('clearLogoButton'),
  logoPreview: document.getElementById('logoPreview'),
  setupLogoFileInput: document.getElementById('setupLogoFileInput'),
  setupUploadLogoButton: document.getElementById('setupUploadLogoButton'),
  setupClearLogoButton: document.getElementById('setupClearLogoButton'),
  setupLogoPreview: document.getElementById('setupLogoPreview'),
  printerSelect: document.getElementById('printerSelect'),
  printerStatus: document.getElementById('printerStatus'),
  refreshPrintersButton: document.getElementById('refreshPrintersButton'),
  testBluetoothPrintButton: document.getElementById('testBluetoothPrintButton'),
  menuCatalogList: document.getElementById('menuCatalogList'),
  menuCatalogMeta: document.getElementById('menuCatalogMeta'),
  categoryForm: document.getElementById('categoryForm'),
  categoryNameInput: document.getElementById('categoryNameInput'),
  categoryCatalogList: document.getElementById('categoryCatalogList'),
  menuEditorModal: document.getElementById('menuEditorModal'),
  menuEditorForm: document.getElementById('menuEditorForm'),
  menuEditorTitle: document.getElementById('menuEditorTitle'),
  menuEditorCaption: document.getElementById('menuEditorCaption'),
  newDishButton: document.getElementById('newDishButton'),
  closeMenuEditorButton: document.getElementById('closeMenuEditorButton'),
  deleteDishButton: document.getElementById('deleteDishButton'),
  settingsRestaurantName: document.getElementById('settingsRestaurantName'),
  settingsSetupState: document.getElementById('settingsSetupState'),
  brandRestaurantName: document.getElementById('brandRestaurantName'),
  brandRestaurantMeta: document.getElementById('brandRestaurantMeta'),
  launchOverlay: document.getElementById('launchOverlay'),
  launchWelcomePanel: document.getElementById('launchWelcomePanel'),
  launchSetupPanel: document.getElementById('launchSetupPanel'),
  launchTitle: document.getElementById('launchTitle'),
  launchCopy: document.getElementById('launchCopy'),
  launchDismissButton: document.getElementById('launchDismissButton'),
  launchRestaurantInline: document.getElementById('launchRestaurantInline'),
  launchLogo: document.getElementById('launchLogo'),
  emptyStateTemplate: document.getElementById('emptyStateTemplate'),
  viewPanels: [...document.querySelectorAll('[data-view]')],
  viewTriggers: [...document.querySelectorAll('[data-view-trigger]')],
};

let longPressTimer = null;
let longPressTriggered = false;
let launchDismissTimer = null;
let launchSequenceShown = false;
let pairedPrinters = [];
let printerStatusMessage = 'Refresh to load paired Bluetooth printers.';
let lastMirroredSnapshot = '';
let activeDrawerTab = 'menu';
let setupDraftLogoDataUrl = '';
let pendingLogoTarget = '';
let storeInitialized = false;
let storeReadyPromise = Promise.resolve();
let nativeBackupCatalog = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function selectedTableId() {
  return getState().selectedTableId;
}

function selectedMenuItem(itemId) {
  return getState().menu.find((item) => item.id === itemId);
}

function setDrawerTab(tab) {
  activeDrawerTab = tab === 'bill' ? 'bill' : 'menu';
  syncDrawerTab();
}

function syncDrawerTab() {
  refs.drawerMenuTabButton?.classList.toggle('is-active', activeDrawerTab === 'menu');
  refs.drawerBillTabButton?.classList.toggle('is-active', activeDrawerTab === 'bill');
  refs.drawerMenuSection?.classList.toggle('hidden', activeDrawerTab !== 'menu');
  refs.drawerBillSection?.classList.toggle('hidden', activeDrawerTab !== 'bill');
}

function focusMenuEditorField(fieldName = 'code') {
  window.setTimeout(() => {
    const field = refs.menuEditorForm?.elements?.namedItem(fieldName);
    if (field && typeof field.focus === 'function') {
      field.focus();
    }
  }, 40);
}

function focusDrawerForTable(tableId, preferredTab = '') {
  const table = getState().tables.find((entry) => entry.id === tableId);
  if (preferredTab) {
    setDrawerTab(preferredTab);
    return;
  }
  setDrawerTab(table?.order?.items?.length ? 'bill' : 'menu');
}

function reportError(error, fallback = 'Something went wrong.') {
  console.error(error);
  refs.statusBar.textContent = error?.message || fallback;
  void flushPersistence().catch(() => undefined);
}

function safely(handler, fallback) {
  return async (event) => {
    try {
      await handler(event);
    } catch (error) {
      reportError(error, fallback);
    }
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downloadTextFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function dismissLaunchOverlay() {
  if (!getState().settings.restaurantName) return;
  refs.launchOverlay.classList.add('is-hidden');
  document.body.classList.remove('launch-active');
}

function scheduleLaunchDismiss(force = false) {
  window.clearTimeout(launchDismissTimer);
  const hasSetup = Boolean(getState().settings.restaurantName);
  const needsSetup = !hasSetup;
  if (!force && launchSequenceShown && !needsSetup) return;
  launchSequenceShown = true;
  refs.launchOverlay.classList.remove('is-hidden');
  document.body.classList.add('launch-active');
  if (needsSetup) return;
  launchDismissTimer = window.setTimeout(dismissLaunchOverlay, 1700);
}

function markSetupDraftDirty() {
  refs.setupForm.dataset.dirty = 'true';
}

function clearSetupDraftState() {
  refs.setupForm.dataset.dirty = 'false';
  refs.setupForm.dataset.logoDataUrl = '';
  setupDraftLogoDataUrl = '';
}

function captureSetupDraft() {
  const draftValues = Object.fromEntries(new FormData(refs.setupForm).entries());
  draftValues.gstEnabled = refs.setupForm.gstEnabled.checked;
  draftValues.themeMode = refs.setupForm.themeMode.value || 'light';
  draftValues.restaurantLogoDataUrl = setupDraftLogoDataUrl || refs.setupForm.dataset.logoDataUrl || '';
  return draftValues;
}

function updateSetupLogoPreview(dataUrl = '') {
  setupDraftLogoDataUrl = dataUrl;
  refs.setupForm.dataset.logoDataUrl = dataUrl;
  refs.setupLogoPreview.innerHTML = dataUrl
    ? `<img src="${escapeHtml(dataUrl)}" alt="Restaurant logo preview" class="brand-logo" />`
    : '<div class="logo-placeholder">Optional logo</div>';
  markSetupDraftDirty();
}

function restoreSetupDraft(draftValues) {
  if (!draftValues) return;
  refs.setupForm.restaurantName.value = draftValues.restaurantName ?? '';
  refs.setupForm.receiptFooter.value = draftValues.receiptFooter ?? '';
  refs.setupForm.serviceChargeRate.value = draftValues.serviceChargeRate ?? '';
  refs.setupForm.gstEnabled.checked = Boolean(draftValues.gstEnabled);
  refs.setupForm.gstRate.value = draftValues.gstRate ?? '';
  refs.setupForm.gstNumber.value = draftValues.gstNumber ?? '';
  refs.setupGstNumberField.classList.toggle('hidden', !refs.setupForm.gstEnabled.checked);
  refs.setupForm.gstNumber.required = refs.setupForm.gstEnabled.checked;
  refs.setupForm.defaultDiscount.value = draftValues.defaultDiscount ?? '';
  refs.setupForm.tableCount.value = draftValues.tableCount ?? '';
  refs.setupForm.themeMode.value = draftValues.themeMode ?? 'light';
  if (Object.prototype.hasOwnProperty.call(draftValues, 'restaurantLogoDataUrl')) {
    updateSetupLogoPreview(draftValues.restaurantLogoDataUrl || '');
  }
}

function requestLogoSelection(target = 'settings') {
  pendingLogoTarget = target;
  if (window.AndroidHost && typeof window.AndroidHost.requestLogoImagePicker === 'function') {
    const result = window.AndroidHost.requestLogoImagePicker();
    if (result) {
      refs.statusBar.textContent = result;
    }
    return;
  }

  if (target === 'setup') {
    refs.setupLogoFileInput.click();
    return;
  }

  refs.logoFileInput.click();
}

window.addEventListener('native-logo-selected', (event) => {
  const dataUrl = String(event.detail?.dataUrl || '');
  if (!dataUrl) {
    refs.statusBar.textContent = 'No logo image was returned from Android.';
    pendingLogoTarget = '';
    return;
  }

  if (pendingLogoTarget === 'setup') {
    updateSetupLogoPreview(dataUrl);
    refs.statusBar.textContent = 'Logo ready. It will be saved when you enter the app.';
    pendingLogoTarget = '';
    return;
  }

  pendingLogoTarget = '';
  void saveSettings({ restaurantLogoDataUrl: dataUrl })
    .then(() => syncBrandShortcut())
    .then(() => {
      refs.statusBar.textContent = 'Restaurant logo saved locally on this device.';
    })
    .catch((error) => reportError(error, 'Unable to save the restaurant logo.'));
});

window.addEventListener('native-logo-selection-error', (event) => {
  refs.statusBar.textContent = String(event.detail?.message || 'Unable to read the selected logo image.');
  pendingLogoTarget = '';
});

async function syncBrandShortcut() {
  const state = getState();
  if (!window.AndroidHost || typeof window.AndroidHost.syncBrandedShortcut !== 'function') return;
  if (!state.settings.restaurantName || !state.settings.restaurantLogoDataUrl) return;
  try {
    const result = window.AndroidHost.syncBrandedShortcut(
      state.settings.restaurantName,
      state.settings.restaurantLogoDataUrl,
    );
    if (result) {
      refs.statusBar.textContent = result;
    }
  } catch (error) {
    console.warn('Shortcut sync failed', error);
  }
}

async function updateLogoSetting(fileInput, options = {}) {
  const file = fileInput.files?.[0];
  if (!file) return;
  const { preserveSetupDraft = false, previewTarget = null } = options;
  const dataUrl = await readFileAsDataUrl(file);

  if (preserveSetupDraft) {
    updateSetupLogoPreview(dataUrl);
    fileInput.value = '';
    refs.statusBar.textContent = 'Logo ready. It will be saved when you enter the app.';
    return;
  }

  if (previewTarget) {
    previewTarget.innerHTML = `<img src="${escapeHtml(dataUrl)}" alt="Restaurant logo preview" class="brand-logo" />`;
  }

  await saveSettings({ restaurantLogoDataUrl: dataUrl });
  fileInput.value = '';
  refs.statusBar.textContent = 'Restaurant logo saved locally on this device.';
  await syncBrandShortcut();
}

function updateGstFieldState(form, fieldWrapper) {
  const enabled = Boolean(form.gstEnabled?.checked);
  fieldWrapper?.classList.toggle('hidden', !enabled);
  if (form.gstNumber) {
    form.gstNumber.required = enabled;
    if (!enabled) {
      form.gstNumber.value = '';
    }
  }
}

function mirrorSnapshotToNativeCache() {
  if (!window.AndroidHost || typeof window.AndroidHost.cacheBackupSnapshot !== 'function') return;
  try {
    const content = JSON.stringify(exportSnapshot());
    if (content === lastMirroredSnapshot) return;
    lastMirroredSnapshot = content;
    window.AndroidHost.cacheBackupSnapshot(content);
  } catch (error) {
    console.warn('Native backup cache sync failed', error);
  }
}

async function importLatestNativeBackup() {
  if (!window.AndroidHost || typeof window.AndroidHost.importLatestBackup !== 'function') {
    return false;
  }

  const payload = JSON.parse(window.AndroidHost.importLatestBackup());
  if (payload.status !== 'ok' || !payload.content) {
    refs.statusBar.textContent = payload.message || 'No automatic backup file was found.';
    return false;
  }

  await importSnapshot(JSON.parse(payload.content));
  dismissLaunchOverlay();
  renderNativeControls(getState());
  refs.statusBar.textContent = payload.message || 'Latest backup restored.';
  return true;
}

function triggerPrint(title = 'AMP PoS Receipt') {
  const html = refs.receiptPrintArea.innerHTML;
  if (!html) {
    refs.statusBar.textContent = 'No receipt content is ready for printing yet.';
    return;
  }
  if (window.AndroidHost && typeof window.AndroidHost.printReceipt === 'function') {
    window.AndroidHost.printReceipt(html, title);
    return;
  }
  window.print();
}

function buildBluetoothReceiptText(receipt) {
  const lines = [];
  lines.push(receipt.settings.restaurantName || 'Restaurant');
  lines.push(`${receipt.tableName} | ${new Date(receipt.closedAt).toLocaleString()}`);
  lines.push('--------------------------------');
  receipt.items.forEach((item) => {
    lines.push(`${item.name} x${item.quantity}`);
    lines.push(`  ${item.price.toFixed(2)} x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}`);
  });
  lines.push('--------------------------------');
  lines.push(`Subtotal: ${receipt.totals.subtotal.toFixed(2)}`);
  lines.push(`Discount: -${receipt.totals.discount.toFixed(2)}`);
  lines.push(`Service: ${receipt.totals.serviceCharge.toFixed(2)}`);
  if (receipt.totals.gstEnabled) {
    lines.push(`GST (${receipt.totals.gstRate}%): ${receipt.totals.gst.toFixed(2)}`);
  }
  lines.push(`Round Off: ${receipt.totals.roundOff.toFixed(2)}`);
  lines.push(`TOTAL: ${receipt.totals.total.toFixed(2)}`);
  lines.push(`Payment: ${receipt.paymentMode}`);
  if (receipt.settings.gstEnabled && receipt.settings.gstNumber) {
    lines.push(`GSTIN: ${receipt.settings.gstNumber}`);
  }
  lines.push('--------------------------------');
  lines.push(receipt.settings.receiptFooter || 'Thanks for dining with us.');
  lines.push('\n\n');
  return lines.join('\n');
}

function tryBluetoothPrint(receipt) {
  const state = getState();
  if (!window.AndroidHost || typeof window.AndroidHost.printBluetoothReceipt !== 'function') return false;
  if (!state.settings.preferredPrinterAddress) return false;
  const result = window.AndroidHost.printBluetoothReceipt(
    buildBluetoothReceiptText(receipt),
    state.settings.preferredPrinterAddress,
  );
  if (result) refs.statusBar.textContent = result;
  return !String(result || '').toLowerCase().includes('failed');
}

function printReceiptUsingPreference(receipt) {
  if (tryBluetoothPrint(receipt)) return;
  triggerPrint(receipt.tableName || 'Closed Receipt');
}

function printActiveReceipt() {
  const state = getState();
  if (state.activeReceipt) {
    printReceiptUsingPreference(state.activeReceipt);
    return;
  }
  const draftReceipt = getSelectedOrderSnapshot();
  if (!draftReceipt) {
    refs.statusBar.textContent = 'Close a bill or open a table with items before printing.';
    return;
  }
  refs.receiptPrintArea.innerHTML = `
    <article class="receipt-sheet">
      <h2>${draftReceipt.settings.restaurantName || 'Restaurant'}</h2>
      <p>${draftReceipt.tableName} &middot; Draft preview</p>
      <p>Use Close and Bill to save this receipt to history.</p>
    </article>
  `;
  if (tryBluetoothPrint(draftReceipt)) return;
  triggerPrint(draftReceipt.tableName || 'Draft Receipt');
}

function markBackupSaved() {
  localStorage.setItem(AUTO_BACKUP_KEY, new Date().toISOString());
  renderNativeControls(getState());
}

function snapshotHasMeaningfulData(snapshot) {
  return Boolean(snapshot?.settings?.restaurantName?.trim())
    || Boolean(snapshot?.billHistory?.length)
    || Boolean(snapshot?.tables?.some((table) => table.order?.items?.length));
}

function buildBackupFilename(reason = 'manual') {
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  return `ken-pos-backup-${stamp}-${reason}.json`;
}

function parseBackupCatalog(raw) {
  if (!raw) {
    return { status: 'empty', message: 'No backup response received.', backups: [] };
  }

  try {
    const payload = JSON.parse(raw);
    return {
      status: payload.status || 'ok',
      message: payload.message || '',
      backups: Array.isArray(payload.backups) ? payload.backups : [],
    };
  } catch {
    return { status: 'error', message: String(raw), backups: [] };
  }
}

async function refreshBackupCatalog() {
  if (!window.AndroidHost || typeof window.AndroidHost.listBackupCatalog !== 'function') {
    nativeBackupCatalog = [];
    renderNativeControls(getState());
    return;
  }

  const payload = parseBackupCatalog(window.AndroidHost.listBackupCatalog());
  nativeBackupCatalog = payload.backups;
  renderNativeControls(getState());
}

function saveExternalBackup(options = {}) {
  const {
    filename = '',
    mirrorLatest = false,
    quiet = false,
  } = options;
  const snapshot = exportSnapshot();
  if (!snapshotHasMeaningfulData(snapshot)) {
    if (!quiet) {
      refs.statusBar.textContent = 'Backup skipped because this workstation does not have meaningful local data yet.';
    }
    return false;
  }

  const content = JSON.stringify(snapshot, null, 2);

  if (window.AndroidHost && typeof window.AndroidHost.cacheBackupSnapshot === 'function') {
    window.AndroidHost.cacheBackupSnapshot(content);
  }

  if (window.AndroidHost && typeof window.AndroidHost.saveExternalBackup === 'function') {
    let result = '';
    if (mirrorLatest) {
      result = window.AndroidHost.saveExternalBackup(content, 'ken-pos-backup-latest.json') || result;
    }
    if (filename) {
      result = window.AndroidHost.saveExternalBackup(content, filename) || result;
    }
    if (!filename && !mirrorLatest) {
      result = window.AndroidHost.saveExternalBackup(content, 'ken-pos-backup-latest.json') || result;
    }
    if (!quiet) {
      refs.statusBar.textContent = result || 'Backup saved to device downloads.';
    }
    markBackupSaved();
    void refreshBackupCatalog();
    return true;
  }

  const downloadName = filename || 'ken-pos-backup-latest.json';
  downloadTextFile(downloadName, content);
  if (!quiet) {
    refs.statusBar.textContent = 'Backup exported from this browser.';
  }
  markBackupSaved();
  return true;
}

async function importNamedNativeBackup(filename) {
  if (!window.AndroidHost || typeof window.AndroidHost.importBackupByName !== 'function') {
    return false;
  }

  const payload = JSON.parse(window.AndroidHost.importBackupByName(filename));
  if (payload.status !== 'ok' || !payload.content) {
    refs.statusBar.textContent = payload.message || 'The selected backup could not be loaded.';
    return false;
  }

  await importSnapshot(JSON.parse(payload.content));
  dismissLaunchOverlay();
  renderNativeControls(getState());
  refs.statusBar.textContent = payload.message || `Backup restored from ${filename}.`;
  void refreshBackupCatalog();
  return true;
}

function maybeRunAutomaticBackup(reason = 'scheduled') {
  if (!window.AndroidHost || typeof window.AndroidHost.saveExternalBackup !== 'function') return;
  const state = getState();
  if (!state.ready) return;

  const immediateReasons = new Set(['bill-close', 'settings', 'setup']);
  if (immediateReasons.has(reason)) {
    try {
      saveExternalBackup({
        filename: buildBackupFilename(reason),
        mirrorLatest: true,
        quiet: reason !== 'bill-close',
      });
      if (reason === 'bill-close') {
        refs.statusBar.textContent = 'Bill closed and backup archived locally in Downloads/KenPoS.';
      }
    } catch (error) {
      console.warn('Immediate backup failed', error);
    }
    return;
  }

  const lastBackupAt = getKnownBackupAt();
  const elapsed = lastBackupAt ? Date.now() - new Date(lastBackupAt).getTime() : Number.POSITIVE_INFINITY;
  if (elapsed < AUTO_BACKUP_INTERVAL_MS) return;

  try {
    saveExternalBackup({ mirrorLatest: true, quiet: true });
    if (reason !== 'manual') {
      refs.statusBar.textContent = 'Automatic backup refreshed in device downloads.';
    }
  } catch (error) {
    console.warn('Automatic backup failed', error);
  }
}
function parsePrinterPayload(raw) {
  if (!raw) {
    return { status: 'empty', message: 'No printer response received.', printers: [] };
  }

  try {
    const payload = JSON.parse(raw);
    return {
      status: payload.status || 'ok',
      message: payload.message || '',
      printers: Array.isArray(payload.printers) ? payload.printers : [],
    };
  } catch {
    return { status: 'error', message: String(raw), printers: [] };
  }
}

function getKnownBackupAt() {
  const localBackupAt = localStorage.getItem(AUTO_BACKUP_KEY);
  if (window.AndroidHost && typeof window.AndroidHost.getLastNativeBackupAt === 'function') {
    const nativeBackupAt = window.AndroidHost.getLastNativeBackupAt();
    if (nativeBackupAt) {
      return nativeBackupAt;
    }
  }
  return localBackupAt;
}

function renderNativeControls(state) {
  const lastBackupAt = getKnownBackupAt();
  refs.backupStatusText.textContent = lastBackupAt
    ? `Latest automatic backup: ${new Date(lastBackupAt).toLocaleString()}. Timestamped archives are kept in Downloads/KenPoS.`
    : 'Automatic backup stores the latest local database snapshot in Downloads/KenPoS once every 24 hours. Timestamped archives are created on bill close and key setup changes.';

  refs.backupCatalogList.innerHTML = nativeBackupCatalog.length
    ? nativeBackupCatalog.map((entry) => `
        <article class="backup-entry premium-subpanel">
          <div>
            <small>${escapeHtml(entry.modifiedAt ? new Date(entry.modifiedAt).toLocaleString() : 'Unknown time')} · ${escapeHtml(entry.sizeLabel || '')}</small>
            <h4>${escapeHtml(entry.name)}</h4>
          </div>
          <div class="backup-entry-actions">
            ${entry.latest ? '<span class="setup-state-pill">Latest</span>' : ''}
            <button class="button button-ghost" type="button" data-restore-backup="${escapeHtml(entry.name)}">Restore</button>
          </div>
        </article>
      `).join('')
    : '<div class="empty-state"><h4>No backups listed</h4><p class="muted">Create a backup or wait for the next automatic archive to populate Downloads/KenPoS.</p></div>';

  const selectedAddress = state.settings.preferredPrinterAddress || '';
  const printerOptions = ['<option value="">System print / none selected</option>']
    .concat(pairedPrinters.map((printer) => (
      `<option value="${escapeHtml(printer.address)}">${escapeHtml(printer.name)}${printer.address ? ` (${escapeHtml(printer.address)})` : ''}</option>`
    )));

  refs.printerSelect.innerHTML = printerOptions.join('');
  if (selectedAddress && pairedPrinters.some((printer) => printer.address === selectedAddress)) {
    refs.printerSelect.value = selectedAddress;
  }
  refs.printerStatus.textContent = printerStatusMessage;
}

function refreshBluetoothPrinters() {
  if (!window.AndroidHost || typeof window.AndroidHost.listPairedBluetoothPrinters !== 'function') {
    printerStatusMessage = 'Bluetooth printer support is only available in the Android app shell.';
    pairedPrinters = [];
    renderNativeControls(getState());
    return;
  }

  const payload = parsePrinterPayload(window.AndroidHost.listPairedBluetoothPrinters());
  pairedPrinters = payload.printers;
  printerStatusMessage = payload.message || (pairedPrinters.length
    ? `Loaded ${pairedPrinters.length} paired Bluetooth printer${pairedPrinters.length === 1 ? '' : 's'}.`
    : 'No paired Bluetooth printers found. Pair the printer in Android settings first.');
  renderNativeControls(getState());
}

function bindNavigation() {
  refs.viewTriggers.forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.viewTrigger));
  });
}

function bindSearch() {
  refs.globalSearch.addEventListener('input', (event) => {
    setSearch(event.target.value);
  });
}

function bindCategoryFilter() {
  refs.categoryChips.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-category]');
    if (chip) setCategory(chip.dataset.category);
  });

  refs.floorFilters.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-floor-filter]');
    if (chip) setFloorFilter(chip.dataset.floorFilter);
  });
}

function bindAnalyticsFilters() {
  refs.historyDateInput?.addEventListener('change', (event) => setHistoryDate(event.target.value));
  refs.compareDayAInput?.addEventListener('change', (event) => setCompareDayA(event.target.value));
  refs.compareDayBInput?.addEventListener('change', (event) => setCompareDayB(event.target.value));
  refs.compareMonthAInput?.addEventListener('change', (event) => setCompareMonthA(event.target.value));
  refs.compareMonthBInput?.addEventListener('change', (event) => setCompareMonthB(event.target.value));
  refs.dishAnalyticsSelect?.addEventListener('change', (event) => setAnalyticsDish(event.target.value));
  refs.resetAnalyticsFiltersButton?.addEventListener('click', () => resetAnalyticsFilters());
}


function bindMenuActions() {
  refs.toggleMenuCardModeButton?.addEventListener('click', safely(async () => {
    const nextMode = getState().settings.menuCardMode === 'compact' ? 'detail' : 'compact';
    await saveSettings({ menuCardMode: nextMode });
  }, 'Unable to switch the menu item view.'));

  refs.menuList.addEventListener('click', safely(async (event) => {
    const button = event.target.closest('[data-add-item]');
    if (!button) return;
    const tableId = selectedTableId();
    if (!tableId) {
      refs.statusBar.textContent = 'Select a table before adding menu items.';
      return;
    }
    const menuItem = selectedMenuItem(button.dataset.addItem);
    if (menuItem) await addItemToTable(tableId, menuItem);
  }, 'Unable to add the item to the order.'));
}

function bindOrderActions() {
  refs.orderItems.addEventListener('click', safely(async (event) => {
    const actionButton = event.target.closest('[data-qty-action]');
    if (!actionButton) return;
    const delta = actionButton.dataset.qtyAction === 'increase' ? 1 : -1;
    await updateItemQuantity(selectedTableId(), actionButton.dataset.itemId, delta);
  }, 'Unable to update the order item.'));

  refs.discountInput.addEventListener('input', safely(async (event) => setDiscount(event.target.value), 'Unable to save the discount.'));
  refs.paymentModeSelect.addEventListener('change', safely(async (event) => setPaymentMode(event.target.value), 'Unable to save the payment mode.'));
  refs.closeDrawerButton.addEventListener('click', () => {
    setDrawerTab('menu');
    closeDrawer();
  });
  refs.holdOrderButton.addEventListener('click', safely(async () => saveDraft(), 'Unable to save the draft.'));
  refs.checkoutButton.addEventListener('click', safely(async () => {
    const receipt = await checkoutSelectedTable();
    if (receipt) {
      setView('summary');
      if (getState().settings.autoPrintOnClose) {
        printReceiptUsingPreference(receipt);
      }
      maybeRunAutomaticBackup('bill-close');
      refs.receiptPreviewPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 'Unable to close this bill.'));
}

function bindSettings() {
  refs.settingsForm.addEventListener('submit', safely(async (event) => {
    event.preventDefault();
    const formData = new FormData(refs.settingsForm);
    const nextSettings = Object.fromEntries(formData.entries());
    nextSettings.gstEnabled = refs.settingsForm.gstEnabled.checked;
    nextSettings.autoPrintOnClose = refs.settingsForm.autoPrintOnClose.checked;
    nextSettings.preferredPrinterAddress = refs.printerSelect.value || '';
    nextSettings.preferredPrinterName = pairedPrinters.find((printer) => printer.address === refs.printerSelect.value)?.name || '';
    await saveSettings(nextSettings);
    await syncBrandShortcut();
    maybeRunAutomaticBackup('settings');
  }, 'Unable to save restaurant settings.'));

  refs.settingsForm.gstEnabled.addEventListener('change', () => updateGstFieldState(refs.settingsForm, refs.settingsGstNumberField));
  refs.uploadLogoButton.addEventListener('click', () => requestLogoSelection('settings'));
  refs.logoFileInput.addEventListener('change', safely(async () => updateLogoSetting(refs.logoFileInput, { previewTarget: refs.logoPreview }), 'Unable to save the restaurant logo.'));
  refs.clearLogoButton.addEventListener('click', safely(async () => {
    await saveSettings({ restaurantLogoDataUrl: '' });
    refs.statusBar.textContent = 'Restaurant logo removed from local branding.';
  }, 'Unable to remove the restaurant logo.'));

  refs.categoryForm.addEventListener('submit', safely(async (event) => {
    event.preventDefault();
    await addMenuCategory(refs.categoryNameInput.value);
    refs.categoryForm.reset();
    refs.categoryNameInput.focus();
  }, 'Unable to add this food category.'));

  refs.categoryCatalogList.addEventListener('click', safely(async (event) => {
    const trigger = event.target.closest('[data-delete-category]');
    if (!trigger) return;
    if (!window.confirm(`Delete ${trigger.dataset.deleteCategory} from the category library?`)) return;
    await removeMenuCategory(trigger.dataset.deleteCategory);
  }, 'Unable to delete this food category.'));

  refs.exportBackupButton.addEventListener('click', () => saveExternalBackup({
    filename: buildBackupFilename('manual'),
    mirrorLatest: true,
  }));

  refs.refreshBackupCatalogButton?.addEventListener('click', () => {
    void refreshBackupCatalog();
  });

  refs.importBackupButton.addEventListener('click', safely(async () => {
    const confirmed = window.confirm('Importing a backup file will wipe the current local menu, tables, drafts, and bill history on this device, then fully restore the selected backup. Continue?');
    if (!confirmed) return;
    refs.backupFileInput.click();
  }, 'Unable to start backup import.'));

  refs.restoreLatestBackupButton?.addEventListener('click', safely(async () => {
    const confirmed = window.confirm('Restoring the latest automatic backup will wipe the current local menu, tables, drafts, and bill history on this device, then fully restore the latest backup from Downloads/KenPoS. Continue?');
    if (!confirmed) return;
    const handled = await importLatestNativeBackup();
    if (!handled) {
      refs.statusBar.textContent = 'No automatic backup was restored from Downloads/KenPoS. Use Import Backup File or the backup list to restore another snapshot.';
    }
  }, 'Unable to restore the latest automatic backup.'));

  refs.backupCatalogList?.addEventListener('click', safely(async (event) => {
    const trigger = event.target.closest('[data-restore-backup]');
    if (!trigger) return;
    const fileName = trigger.dataset.restoreBackup;
    const confirmed = window.confirm(`Restoring ${fileName} will wipe the current local menu, tables, drafts, and bill history on this device, then fully restore that backup. Continue?`);
    if (!confirmed) return;
    await importNamedNativeBackup(fileName);
  }, 'Unable to restore the selected backup.'));

  refs.backupFileInput.addEventListener('change', safely(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const confirmed = window.confirm('Importing a backup will wipe the current local menu, tables, drafts, and bill history on this device, then fully restore the selected backup. Continue?');
    if (!confirmed) {
      refs.backupFileInput.value = '';
      return;
    }
    const text = await file.text();
    await importSnapshot(JSON.parse(text));
    refs.backupFileInput.value = '';
    dismissLaunchOverlay();
    renderNativeControls(getState());
    void refreshBackupCatalog();
  }, 'Unable to import the backup.'));

  refs.resetDraftsButton.addEventListener('click', safely(async () => {
    if (window.confirm('Clear all open table drafts from this device?')) {
      await clearOpenDrafts();
    }
  }, 'Unable to clear open drafts.'));

  refs.clearHistoryButton.addEventListener('click', safely(async () => {
    if (window.confirm('Delete all saved bill history from this device? This cannot be undone.')) {
      await clearHistory();
    }
  }, 'Unable to clear bill history.'));

  refs.refreshPrintersButton.addEventListener('click', () => refreshBluetoothPrinters());
  refs.testBluetoothPrintButton.addEventListener('click', () => {
    const state = getState();
    if (state.activeReceipt) {
      printReceiptUsingPreference(state.activeReceipt);
      return;
    }
    const draftReceipt = getSelectedOrderSnapshot();
    if (draftReceipt) {
      printReceiptUsingPreference(draftReceipt);
      return;
    }
    refs.statusBar.textContent = 'Open a draft or historical receipt before sending a test print.';
  });
}
function bindRestaurantSetup() {
  refs.setupForm.addEventListener('input', () => markSetupDraftDirty());
  refs.setupForm.addEventListener('change', () => markSetupDraftDirty());

  refs.setupForm.addEventListener('submit', safely(async (event) => {
    event.preventDefault();
    refs.statusBar.textContent = 'Finalizing local workstation setup...';
    await storeReadyPromise.catch(() => undefined);
    const setupValues = captureSetupDraft();
    await completeRestaurantSetup(setupValues);
    clearSetupDraftState();
    await syncBrandShortcut();
    setView('floor');
    dismissLaunchOverlay();
    maybeRunAutomaticBackup('setup');
  }, 'Unable to complete restaurant setup.'));

  refs.setupForm.gstEnabled.addEventListener('change', () => updateGstFieldState(refs.setupForm, refs.setupGstNumberField));
  refs.setupUploadLogoButton.addEventListener('click', () => requestLogoSelection('setup'));
  refs.setupLogoFileInput.addEventListener('change', safely(async () => updateLogoSetting(refs.setupLogoFileInput, {
    preserveSetupDraft: true,
    previewTarget: refs.setupLogoPreview,
  }), 'Unable to save the setup logo.'));
  refs.setupClearLogoButton.addEventListener('click', safely(async () => {
    updateSetupLogoPreview('');
    refs.statusBar.textContent = 'Setup logo cleared.';
  }, 'Unable to clear the setup logo.'));
}

function bindMenuManagement() {
  refs.menuCatalogList.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-menu-editor-id]');
    if (!trigger) return;
    selectMenuEditorItem(trigger.dataset.menuEditorId);
    focusMenuEditorField('name');
  });

  refs.newDishButton.addEventListener('click', () => {
    startMenuItemCreation();
    focusMenuEditorField('code');
  });

  refs.closeMenuEditorButton.addEventListener('click', () => closeMenuEditor());
  refs.menuEditorModal.addEventListener('click', (event) => {
    if (event.target === refs.menuEditorModal) {
      closeMenuEditor();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !refs.menuEditorModal.classList.contains('hidden')) {
      closeMenuEditor();
    }
  });

  refs.menuEditorForm.addEventListener('submit', safely(async (event) => {
    event.preventDefault();
    const formData = new FormData(refs.menuEditorForm);
    await saveMenuItemDraft(Object.fromEntries(formData.entries()));
  }, 'Unable to save this dish.'));

  refs.deleteDishButton.addEventListener('click', safely(async () => {
    if (!window.confirm('Remove this dish from the local menu?')) return;
    await deleteMenuItem();
  }, 'Unable to delete this dish.'));
}
function bindSummaryActions() {
  refs.billHistory.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-receipt-id]');
    if (!trigger) return;
    setActiveReceipt(trigger.dataset.receiptId);
    refs.receiptPreviewPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  refs.printSelectedReceiptButton?.addEventListener('click', () => printActiveReceipt());
  refs.closeReceiptPreviewButton?.addEventListener('click', () => setActiveReceipt(''));
}

function bindUtilityActions() {
  refs.createWalkInButton.addEventListener('click', () => {
    openWalkIn();
    setDrawerTab('menu');
  });
  refs.toggleFloorCardModeButton?.addEventListener('click', safely(async () => {
    const nextMode = getState().settings.floorCardMode === 'compact' ? 'detail' : 'compact';
    await saveSettings({ floorCardMode: nextMode });
  }, 'Unable to switch the floor card view.'));
  refs.drawerMenuTabButton?.addEventListener('click', () => setDrawerTab('menu'));
  refs.drawerBillTabButton?.addEventListener('click', () => setDrawerTab('bill'));
  refs.clearMoveModeButton.addEventListener('click', () => clearMoveOrder());
  refs.printReceiptButton?.addEventListener('click', () => printActiveReceipt());
  refs.printSummaryButton?.addEventListener('click', () => printActiveReceipt());
  refs.launchDismissButton.addEventListener('click', () => dismissLaunchOverlay());
}

function bindLifecyclePersistence() {
  const flush = () => {
    maybeRunAutomaticBackup('lifecycle');
    void flushPersistence().catch(() => undefined);
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', flush);
}

function bindGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message || 'Unexpected runtime error.'));
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason || 'Unhandled promise rejection.')));
  });
}

function bindTableInteractions() {
  const clearLongPress = () => {
    window.clearTimeout(longPressTimer);
    longPressTimer = null;
  };

  refs.tableGrid.addEventListener('pointerdown', (event) => {
    const card = event.target.closest('[data-table-id]');
    if (!card) return;
    longPressTriggered = false;
    clearLongPress();
    longPressTimer = window.setTimeout(() => {
      longPressTriggered = true;
      startMoveOrder(card.dataset.tableId);
    }, 520);
  });

  ['pointerup', 'pointerleave', 'pointercancel'].forEach((eventName) => {
    refs.tableGrid.addEventListener(eventName, clearLongPress);
  });

  refs.tableGrid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-table-id]');
    if (!card || longPressTriggered) {
      longPressTriggered = false;
      return;
    }
    selectTable(card.dataset.tableId);
  });

  refs.tableGrid.addEventListener('contextmenu', (event) => {
    const card = event.target.closest('[data-table-id]');
    if (!card) return;
    event.preventDefault();
    startMoveOrder(card.dataset.tableId);
  });
}

async function registerServiceWorker() {
  const isAndroidShell = Boolean(window.AndroidHost) || location.hostname === 'appassets.androidplatform.net';
  if (!('serviceWorker' in navigator) || location.protocol === 'file:' || isAndroidShell) return;
  try {
    await navigator.serviceWorker.register('./sw.js');
  } catch (error) {
    console.warn('Service worker registration failed', error);
  }
}

subscribe((state) => {
  renderApp(state, refs);
  renderNativeControls(state);
  syncDrawerTab();
  if (state.ready) {
    mirrorSnapshotToNativeCache();
  }
});

bindNavigation();
bindSearch();
bindCategoryFilter();
bindAnalyticsFilters();
bindMenuActions();
bindOrderActions();
bindSettings();
bindRestaurantSetup();
bindMenuManagement();
bindSummaryActions();
bindUtilityActions();
bindLifecyclePersistence();
bindGlobalErrorHandlers();
bindTableInteractions();

storeReadyPromise = initializeStore().then(() => {
  storeInitialized = true;
  scheduleLaunchDismiss(true);
  renderNativeControls(getState());
  refreshBluetoothPrinters();
  maybeRunAutomaticBackup('startup');
  window.setInterval(() => {
    maybeRunAutomaticBackup('timer');
  }, BACKUP_CHECK_INTERVAL_MS);
}).catch((error) => {
  reportError(error, 'Initialization failed. Check browser support for IndexedDB.');
});

registerServiceWorker();























