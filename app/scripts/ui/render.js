import { calculateTotals } from '../domain/billing.js';
import { formatCompactCurrency, formatCurrency, formatDateTime, formatTime } from '../utils/format.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function dateKey(iso) {
  return String(iso || '').slice(0, 10);
}

function monthKey(iso) {
  return String(iso || '').slice(0, 7);
}

function summarizeBills(bills) {
  const revenue = bills.reduce((sum, entry) => sum + entry.totals.total, 0);
  const items = bills.reduce((sum, entry) => sum + entry.totals.itemCount, 0);
  return {
    bills: bills.length,
    revenue,
    averageBill: bills.length ? revenue / bills.length : 0,
    items,
  };
}

function compareSummaries(left, right) {
  return {
    revenueDelta: left.revenue - right.revenue,
    billsDelta: left.bills - right.bills,
    itemsDelta: left.items - right.items,
  };
}

function buildDishAnalytics(history) {
  const map = new Map();
  history.forEach((bill) => {
    bill.items.forEach((item) => {
      const current = map.get(item.id) ?? {
        id: item.id,
        name: item.name,
        code: item.code,
        quantity: 0,
        revenue: 0,
        orders: 0,
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      current.orders += 1;
      map.set(item.id, current);
    });
  });
  return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
}

function getTableStatus(table) {
  if (!table.order?.items?.length) return 'available';
  const ageMinutes = Math.max(0, Math.floor((Date.now() - new Date(table.order.createdAt).getTime()) / 60000));
  return ageMinutes >= 25 ? 'waiting' : 'occupied';
}

function getFilteredMenu(menu, search, category) {
  return menu.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const query = search.trim().toLowerCase();
    const haystack = `${item.name} ${item.code} ${item.category}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
}

function getVisibleTables(tables, filter) {
  if (filter === 'active') return tables.filter((table) => table.order?.items?.length);
  if (filter === 'available') return tables.filter((table) => !table.order?.items?.length);
  if (filter === 'waiting') return tables.filter((table) => getTableStatus(table) === 'waiting');
  return tables;
}

function computeOverallSummary(history) {
  const revenue = history.reduce((sum, entry) => sum + entry.totals.total, 0);
  const topItemsMap = new Map();
  const paymentMap = new Map();

  history.forEach((entry) => {
    paymentMap.set(entry.paymentMode, (paymentMap.get(entry.paymentMode) ?? 0) + entry.totals.total);
    entry.items.forEach((item) => {
      const current = topItemsMap.get(item.id) ?? { name: item.name, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.quantity * item.price;
      topItemsMap.set(item.id, current);
    });
  });

  return {
    revenue,
    topItems: Array.from(topItemsMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    paymentSplits: Array.from(paymentMap.entries()).sort((a, b) => b[1] - a[1]),
  };
}

function logoMarkup(dataUrl, alt, className = '') {
  if (!dataUrl) return '';
  return `<img src="${escapeHtml(dataUrl)}" alt="${escapeHtml(alt)}" class="${className}" />`;
}

function getSelectedMenuEditorItem(state) {
  return state.menu.find((item) => item.id === state.selectedMenuEditorId) ?? null;
}

function buildReceiptMarkup(receipt) {
  if (!receipt) return '';

  const receiptLogo = receipt.settings.restaurantLogoDataUrl
    ? `<div class="receipt-logo">${logoMarkup(receipt.settings.restaurantLogoDataUrl, `${receipt.settings.restaurantName} logo`)}</div>`
    : '';

  return `
    <article class="receipt-sheet">
      ${receiptLogo}
      <h2>${escapeHtml(receipt.settings.restaurantName)}</h2>
      <p>${escapeHtml(receipt.tableName)} � ${formatDateTime(receipt.closedAt)}</p>
      <div class="receipt-divider"></div>
      <div class="receipt-items">
        ${receipt.items.map((item) => `
          <div class="receipt-row"><span>${escapeHtml(item.name)} x${item.quantity}</span><span>${formatCurrency(item.price * item.quantity)}</span></div>
        `).join('')}
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Subtotal</span><span>${formatCurrency(receipt.totals.subtotal)}</span></div>
      <div class="receipt-row"><span>Discount</span><span>-${formatCurrency(receipt.totals.discount)}</span></div>
      <div class="receipt-row"><span>Service Charge</span><span>${formatCurrency(receipt.totals.serviceCharge)}</span></div>
      ${receipt.totals.gstEnabled ? `<div class="receipt-row"><span>GST (${receipt.totals.gstRate}%)</span><span>${formatCurrency(receipt.totals.gst)}</span></div>` : ''}
      <div class="receipt-row"><span>Round Off</span><span>${formatCurrency(receipt.totals.roundOff)}</span></div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><strong>Total</strong><strong>${formatCurrency(receipt.totals.total)}</strong></div>
      <div class="receipt-row"><span>Payment</span><span>${escapeHtml(receipt.paymentMode)}</span></div>
      ${receipt.settings.gstEnabled && receipt.settings.gstNumber ? `<div class="receipt-row"><span>GSTIN</span><span>${escapeHtml(receipt.settings.gstNumber)}</span></div>` : ''}
      <div class="receipt-divider"></div>
      <p>${escapeHtml(receipt.settings.receiptFooter)}</p>
      <p>Print, save as PDF, or send this receipt to a paired Bluetooth printer.</p>
    </article>
  `;
}

function renderLaunch(state, refs) {
  const restaurantName = state.settings.restaurantName || 'Your Restaurant';
  const hasSetup = Boolean(state.settings.restaurantName.trim());
  const isReady = Boolean(state.ready);
  refs.launchOverlay.dataset.mode = hasSetup ? 'welcome' : 'setup';
  refs.launchOverlay.dataset.ready = isReady ? 'true' : 'false';
  refs.launchTitle.textContent = hasSetup ? restaurantName : isReady ? 'Set up your restaurant' : 'Preparing workstation';
  refs.launchCopy.textContent = hasSetup
    ? 'Built by Gurman Singh for'
    : isReady
      ? 'Add your restaurant identity once. You can change everything later in Settings.'
      : 'Loading local tables, menu, and settings from this device.';
  refs.launchRestaurantInline.textContent = restaurantName;
  refs.launchWelcomePanel.classList.toggle('hidden', !hasSetup);
  refs.launchSetupPanel.classList.toggle('hidden', hasSetup);
  refs.launchDismissButton.classList.toggle('hidden', !hasSetup);
  refs.launchDismissButton.textContent = hasSetup ? 'Start Service' : 'Continue';
  [...refs.setupForm.elements].forEach((field) => {
    if ('disabled' in field) {
      field.disabled = !isReady;
    }
  });
  refs.launchLogo.innerHTML = state.settings.restaurantLogoDataUrl
    ? logoMarkup(state.settings.restaurantLogoDataUrl, `${restaurantName} logo`, 'launch-logo-image')
    : '<span>K</span>';
  refs.setupForm.restaurantName.value = state.settings.restaurantName;
  refs.setupForm.receiptFooter.value = state.settings.receiptFooter;
  refs.setupForm.serviceChargeRate.value = state.settings.serviceChargeRate;
  refs.setupForm.gstEnabled.checked = Boolean(state.settings.gstEnabled);
  refs.setupForm.gstRate.value = state.settings.gstRate;
  refs.setupForm.gstNumber.value = state.settings.gstNumber;
  refs.setupForm.gstNumber.required = Boolean(state.settings.gstEnabled);
  refs.setupGstNumberField.classList.toggle('hidden', !state.settings.gstEnabled);
  refs.setupForm.defaultDiscount.value = state.settings.defaultDiscount;
  refs.setupForm.tableCount.value = state.settings.tableCount;
  refs.setupForm.themeMode.value = state.settings.themeMode;
  refs.setupLogoPreview.innerHTML = state.settings.restaurantLogoDataUrl
    ? logoMarkup(state.settings.restaurantLogoDataUrl, `${restaurantName} logo`, 'brand-logo')
    : '<div class="logo-placeholder">Optional logo</div>';
}

function renderBranding(state, refs) {
  const restaurantName = state.settings.restaurantName || 'AMP Restaurant POS';
  refs.brandRestaurantName.textContent = restaurantName;
  refs.brandRestaurantMeta.textContent = state.settings.restaurantName
    ? 'Calm service flow for busy shifts.'
    : 'Complete setup to personalize this workstation.';
  refs.floorHeroRestaurantName.textContent = restaurantName;
  refs.floorHeroSubtitle.textContent = state.settings.restaurantName
    ? 'Royal floor control with locally saved drafts, bills, and printer-ready receipts.'
    : 'Complete setup to add your restaurant identity, floor size, and billing defaults.';
}

function renderShiftSnapshot(state, refs) {
  const occupied = state.tables.filter((table) => table.order?.items?.length).length;
  const liveRevenue = state.tables.reduce((sum, table) => {
    if (!table.order?.items?.length) return sum;
    return sum + calculateTotals(table.order, state.settings).total;
  }, 0);
  const waiting = state.tables.filter((table) => getTableStatus(table) === 'waiting').length;

  refs.shiftSnapshot.innerHTML = `
    <div class="shift-item"><span class="muted">Open checks</span><strong>${occupied}</strong></div>
    <div class="shift-item"><span class="muted">Draft value</span><strong>${formatCurrency(liveRevenue)}</strong></div>
    <div class="shift-item"><span class="muted">Waiting tables</span><strong>${waiting}</strong></div>
    <div class="shift-item"><span class="muted">Closed bills</span><strong>${state.billHistory.length}</strong></div>
  `;
}

function renderStatusBar(state, refs) {
  refs.statusBar.textContent = state.statusMessage;
  refs.statusBar.classList.toggle('is-alert', Boolean(state.moveOrderFromTableId));
}

function renderFloorFilters(state, refs) {
  const counts = {
    all: state.tables.length,
    active: state.tables.filter((table) => table.order?.items?.length).length,
    waiting: state.tables.filter((table) => getTableStatus(table) === 'waiting').length,
    available: state.tables.filter((table) => !table.order?.items?.length).length,
  };

  refs.floorFilters.innerHTML = [
    ['all', 'All'],
    ['active', 'Active'],
    ['waiting', 'Waiting'],
    ['available', 'Available'],
  ].map(([value, label]) => `
    <button class="category-chip ${state.floorFilter === value ? 'is-active' : ''}" data-floor-filter="${value}">${label} (${counts[value]})</button>
  `).join('');

  refs.floorSnapshot.innerHTML = `
    <article class="metric-card compact-metric">
      <small class="muted">Visible Tables</small>
      <strong class="metric-value">${getVisibleTables(state.tables, state.floorFilter).length}</strong>
      <span class="muted">Filter: ${escapeHtml(state.floorFilter)}</span>
    </article>
    <article class="metric-card compact-metric">
      <small class="muted">Open Draft Value</small>
      <strong class="metric-value">${formatCompactCurrency(state.tables.reduce((sum, table) => sum + (table.order?.items?.length ? calculateTotals(table.order, state.settings).total : 0), 0))}</strong>
      <span class="muted">All active tables</span>
    </article>
    <article class="metric-card compact-metric">
      <small class="muted">Floor Plan</small>
      <strong class="metric-value">${state.settings.tableCount}</strong>
      <span class="muted">Tables plus walk-in counter</span>
    </article>
  `;
}

function renderTables(state, refs) {
  const visibleTables = getVisibleTables(state.tables, state.floorFilter);
  const compactMode = state.settings.floorCardMode === 'compact';
  refs.toggleFloorCardModeButton.textContent = compactMode ? 'Detailed Tables' : 'Compact Tables';

  if (!visibleTables.length) {
    refs.tableGrid.innerHTML = '<div class="empty-state"><h4>No tables in this filter</h4><p class="muted">Try another floor filter or start a new walk-in order.</p></div>';
    return;
  }

  refs.tableGrid.classList.toggle('table-grid-compact', compactMode);
  refs.tableGrid.innerHTML = visibleTables.map((table) => {
    const status = getTableStatus(table);
    const totals = table.order ? calculateTotals(table.order, state.settings) : null;
    const amount = totals ? formatCurrency(totals.total) : formatCurrency(0);
    const ageMinutes = table.order?.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(table.order.createdAt).getTime()) / 60000)) : 0;
    const summary = table.order?.items?.length ? `${totals.itemCount} items � ${ageMinutes} min open` : `${table.seats} covers � ready`;

    if (compactMode) {
      return `
        <article class="table-card table-card-compact status-${status} ${state.moveOrderFromTableId === table.id ? 'move-source' : ''} ${state.moveOrderFromTableId && !table.order?.items?.length ? 'move-target' : ''}" data-table-id="${table.id}">
          <div class="compact-table-name">${escapeHtml(table.name.replace('Table ', 'T'))}</div>
          <div class="compact-table-total">${amount}</div>
          <div class="compact-table-state ${status}">${status === 'waiting' ? 'Waiting' : status === 'occupied' ? 'Occupied' : 'Open'}</div>
        </article>
      `;
    }

    return `
      <article class="table-card status-${status} ${state.moveOrderFromTableId === table.id ? 'move-source' : ''} ${state.moveOrderFromTableId && !table.order?.items?.length ? 'move-target' : ''}" data-table-id="${table.id}">
        <div class="table-head">
          <div>
            <p class="table-name">${escapeHtml(table.name)}</p>
            <p class="muted">${escapeHtml(summary)}</p>
          </div>
          <div class="table-state">
            <span class="pulse-dot"></span>
            <span>${status === 'waiting' ? 'Waiting' : status === 'occupied' ? 'Occupied' : 'Available'}</span>
          </div>
        </div>
        <div class="table-meta">
          <span>${table.order?.items?.length ? `${escapeHtml(table.order.items[0].name)}${table.order.items.length > 1 ? ` +${table.order.items.length - 1}` : ''}` : 'Tap to start a fresh order'}</span>
          <strong class="table-subtotal">${amount}</strong>
        </div>
        <div class="table-foot">
          <span class="muted">Hold press to move</span>
          <span>${status === 'available' ? 'Open table' : 'Resume check'}</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderMenu(state, refs) {
  const categories = ['All', ...new Set(state.menu.map((item) => item.category))];
  refs.categoryChips.innerHTML = categories.map((category) => `
    <button class="category-chip ${category === state.category ? 'is-active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join('');

  const filtered = getFilteredMenu(state.menu, state.search, state.category);
  refs.menuList.innerHTML = filtered.length ? filtered.map((item) => `
    <article class="menu-card">
      <div class="menu-card-head">
        <div>
          <small>${escapeHtml(item.code)} � ${escapeHtml(item.category)}</small>
          <h4>${escapeHtml(item.name)}</h4>
        </div>
        <span class="price-tag">${formatCurrency(item.price)}</span>
      </div>
      <p class="muted">${escapeHtml(item.note || 'No note added')}</p>
      <div class="badge-row">
        <span class="badge ${item.type}"><span class="food-dot ${item.type}"></span>${item.type === 'veg' ? 'Veg' : 'Non-Veg'}</span>
      </div>
      <button class="add-button" data-add-item="${item.id}">Add to check</button>
    </article>
  `).join('') : '<div class="empty-state"><h4>No menu matches</h4><p class="muted">Try a different code, name, or category.</p></div>';
}

function renderOrder(state, refs) {
  const table = state.tables.find((entry) => entry.id === state.selectedTableId);
  const hasTable = Boolean(table);
  refs.orderDrawer.classList.toggle('is-closed', !hasTable);
  refs.drawerTitle.textContent = hasTable ? table.name : 'Select a table';

  if (!hasTable) {
    refs.orderMeta.innerHTML = '<div class="empty-state"><h4>No table selected</h4><p class="muted">Choose a floor card to open the check.</p></div>';
    refs.orderItems.innerHTML = '';
    refs.billingSummary.innerHTML = '<p class="muted">Billing preview appears here.</p>';
    return;
  }

  const order = table.order;
  refs.orderMeta.innerHTML = `
    <div class="order-meta-row"><span class="muted">Seats</span><strong>${table.seats}</strong></div>
    <div class="order-meta-row"><span class="muted">Last update</span><strong>${order ? formatTime(order.updatedAt) : 'Fresh check'}</strong></div>
    <div class="order-meta-row"><span class="muted">Mode</span><strong>${table.id === 'counter' ? 'Walk-In' : 'Dine-In'}</strong></div>
  `;

  if (!order?.items?.length) {
    refs.orderItems.innerHTML = '<div class="empty-state"><h4>Quiet slate</h4><p class="muted">Add dishes from the menu to begin this table.</p></div>';
    refs.discountInput.value = state.settings.defaultDiscount ?? 0;
    refs.paymentModeSelect.value = 'Cash';
    refs.billingSummary.innerHTML = `
      <div class="bill-line muted-line"><span>Subtotal</span><span>${formatCurrency(0)}</span></div>
      <div class="bill-line"><span class="bill-total">${formatCurrency(0)}</span><span class="muted">Awaiting items</span></div>
    `;
    return;
  }

  const totals = calculateTotals(order, state.settings);
  refs.discountInput.value = order.discount ?? 0;
  refs.paymentModeSelect.value = order.paymentMode ?? 'Cash';

  refs.orderItems.innerHTML = order.items.map((item) => `
    <article class="order-card">
      <div class="order-row">
        <div>
          <small>${escapeHtml(item.code)} � ${escapeHtml(item.category)}</small>
          <h4>${escapeHtml(item.name)}</h4>
        </div>
        <span class="price-tag">${formatCurrency(item.price * item.quantity)}</span>
      </div>
      <div class="order-row">
        <span class="badge ${item.type}"><span class="food-dot ${item.type}"></span>${item.type === 'veg' ? 'Veg' : 'Non-Veg'}</span>
        <div class="qty-controls">
          <button class="qty-button" data-qty-action="decrease" data-item-id="${item.id}">-</button>
          <span class="qty-pill">${item.quantity}</span>
          <button class="qty-button" data-qty-action="increase" data-item-id="${item.id}">+</button>
        </div>
      </div>
    </article>
  `).join('');

  refs.billingSummary.innerHTML = `
    <div class="bill-line muted-line"><span>Subtotal</span><span>${formatCurrency(totals.subtotal)}</span></div>
    <div class="bill-line muted-line"><span>Discount</span><span>-${formatCurrency(totals.discount)}</span></div>
    <div class="bill-line muted-line"><span>Service Charge (${totals.serviceChargeRate}%)</span><span>${formatCurrency(totals.serviceCharge)}</span></div>
    ${totals.gstEnabled ? `<div class="bill-line muted-line"><span>GST (${totals.gstRate}%)</span><span>${formatCurrency(totals.gst)}</span></div>` : ''}
    <div class="bill-line muted-line"><span>Round Off</span><span>${formatCurrency(totals.roundOff)}</span></div>
    <div class="bill-line"><span class="bill-total">${formatCurrency(totals.total)}</span><span class="muted">${totals.itemCount} items</span></div>
  `;
}

function renderSummary(state, refs) {
  const overall = computeOverallSummary(state.billHistory);
  const filteredBills = state.billHistory.filter((bill) => dateKey(bill.closedAt) === state.analytics.historyDate);
  const filteredSummary = summarizeBills(filteredBills);
  const dayA = summarizeBills(state.billHistory.filter((bill) => dateKey(bill.closedAt) === state.analytics.compareDayA));
  const dayB = summarizeBills(state.billHistory.filter((bill) => dateKey(bill.closedAt) === state.analytics.compareDayB));
  const monthA = summarizeBills(state.billHistory.filter((bill) => monthKey(bill.closedAt) === state.analytics.compareMonthA));
  const monthB = summarizeBills(state.billHistory.filter((bill) => monthKey(bill.closedAt) === state.analytics.compareMonthB));
  const dayDelta = compareSummaries(dayA, dayB);
  const monthDelta = compareSummaries(monthA, monthB);
  const dishAnalytics = buildDishAnalytics(state.billHistory);
  const selectedDish = state.analytics.dishId === 'all'
    ? null
    : dishAnalytics.find((item) => item.id === state.analytics.dishId) ?? null;

  refs.historyDateInput.value = state.analytics.historyDate;
  refs.compareDayAInput.value = state.analytics.compareDayA;
  refs.compareDayBInput.value = state.analytics.compareDayB;
  refs.compareMonthAInput.value = state.analytics.compareMonthA;
  refs.compareMonthBInput.value = state.analytics.compareMonthB;

  refs.dishAnalyticsSelect.innerHTML = [
    '<option value="all">All dishes</option>',
    ...dishAnalytics.map((dish) => `<option value="${dish.id}" ${dish.id === state.analytics.dishId ? 'selected' : ''}>${escapeHtml(dish.name)}</option>`),
  ].join('');

  refs.summaryCards.innerHTML = `
    <article class="metric-card">
      <small class="muted">Selected Day Revenue</small>
      <strong class="metric-value">${formatCompactCurrency(filteredSummary.revenue)}</strong>
      <span class="muted">${filteredSummary.bills} bills on ${escapeHtml(state.analytics.historyDate)}</span>
    </article>
    <article class="metric-card">
      <small class="muted">All-Time Revenue</small>
      <strong class="metric-value">${formatCompactCurrency(overall.revenue)}</strong>
      <span class="muted">${state.billHistory.length} bills stored locally</span>
    </article>
    <article class="metric-card">
      <small class="muted">Average Bill</small>
      <strong class="metric-value">${formatCompactCurrency(filteredSummary.averageBill)}</strong>
      <span class="muted">${filteredSummary.items} items sold on selected day</span>
    </article>
  `;

  refs.topItems.innerHTML = overall.topItems.length
    ? overall.topItems.map((item) => `
        <article class="summary-item">
          <div>
            <small>Qty ${item.quantity}</small>
            <h4>${escapeHtml(item.name)}</h4>
          </div>
          <strong>${formatCurrency(item.revenue)}</strong>
        </article>
      `).join('')
    : refs.emptyStateTemplate.innerHTML;

  refs.paymentSplit.innerHTML = overall.paymentSplits.length
    ? overall.paymentSplits.map(([mode, total]) => `
        <article class="summary-item">
          <div>
            <small>Payment mode</small>
            <h4>${escapeHtml(mode)}</h4>
          </div>
          <strong>${formatCurrency(total)}</strong>
        </article>
      `).join('')
    : refs.emptyStateTemplate.innerHTML;

  refs.billHistory.innerHTML = filteredBills.length
    ? filteredBills.map((bill) => `
        <button class="history-row button-ghost ${state.activeReceipt?.id === bill.id ? 'is-active' : ''}" data-receipt-id="${bill.id}">
          <div>
            <small>${formatDateTime(bill.closedAt)}</small>
            <h4>${escapeHtml(bill.tableName)}</h4>
          </div>
          <div class="history-row-meta">
            <strong>${formatCurrency(bill.totals.total)}</strong>
            <small>${escapeHtml(bill.paymentMode)}</small>
          </div>
        </button>
      `).join('')
    : refs.emptyStateTemplate.innerHTML;

  refs.dayComparison.innerHTML = `
    <article class="analytics-row">
      <div>
        <small>${escapeHtml(state.analytics.compareDayA)}</small>
        <h4>${formatCurrency(dayA.revenue)}</h4>
      </div>
      <div>
        <small>${escapeHtml(state.analytics.compareDayB)}</small>
        <h4>${formatCurrency(dayB.revenue)}</h4>
      </div>
      <div>
        <small>Delta</small>
        <h4>${dayDelta.revenueDelta >= 0 ? '+' : ''}${formatCurrency(dayDelta.revenueDelta)}</h4>
      </div>
    </article>
    <article class="analytics-row compact-row">
      <span>Bills: ${dayA.bills} vs ${dayB.bills}</span>
      <span>Items: ${dayA.items} vs ${dayB.items}</span>
      <span>Bill delta: ${dayDelta.billsDelta >= 0 ? '+' : ''}${dayDelta.billsDelta}</span>
    </article>
  `;

  refs.monthComparison.innerHTML = `
    <article class="analytics-row">
      <div>
        <small>${escapeHtml(state.analytics.compareMonthA)}</small>
        <h4>${formatCurrency(monthA.revenue)}</h4>
      </div>
      <div>
        <small>${escapeHtml(state.analytics.compareMonthB)}</small>
        <h4>${formatCurrency(monthB.revenue)}</h4>
      </div>
      <div>
        <small>Delta</small>
        <h4>${monthDelta.revenueDelta >= 0 ? '+' : ''}${formatCurrency(monthDelta.revenueDelta)}</h4>
      </div>
    </article>
    <article class="analytics-row compact-row">
      <span>Bills: ${monthA.bills} vs ${monthB.bills}</span>
      <span>Items: ${monthA.items} vs ${monthB.items}</span>
      <span>Bill delta: ${monthDelta.billsDelta >= 0 ? '+' : ''}${monthDelta.billsDelta}</span>
    </article>
  `;

  refs.dishAnalyticsList.innerHTML = selectedDish
    ? `
        <article class="summary-item">
          <div>
            <small>${escapeHtml(selectedDish.code)}</small>
            <h4>${escapeHtml(selectedDish.name)}</h4>
          </div>
          <strong>${selectedDish.quantity} orders</strong>
        </article>
        <article class="analytics-row compact-row">
          <span>Revenue: ${formatCurrency(selectedDish.revenue)}</span>
          <span>Bills touched: ${selectedDish.orders}</span>
          <span>Avg qty per bill: ${(selectedDish.quantity / Math.max(1, selectedDish.orders)).toFixed(1)}</span>
        </article>
      `
    : dishAnalytics.length
      ? dishAnalytics.slice(0, 12).map((dish) => `
          <article class="summary-item">
            <div>
              <small>${escapeHtml(dish.code)}</small>
              <h4>${escapeHtml(dish.name)}</h4>
            </div>
            <div class="summary-item-stats">
              <strong>${dish.quantity}</strong>
              <small>${formatCurrency(dish.revenue)}</small>
            </div>
          </article>
        `).join('')
      : refs.emptyStateTemplate.innerHTML;
}

function renderSettings(state, refs) {
  const selectedMenuItem = getSelectedMenuEditorItem(state);
  const restaurantName = state.settings.restaurantName || 'Your Restaurant';

  refs.settingsForm.serviceChargeRate.value = state.settings.serviceChargeRate;
  refs.settingsForm.gstEnabled.checked = Boolean(state.settings.gstEnabled);
  refs.settingsForm.gstRate.value = state.settings.gstRate;
  refs.settingsForm.gstNumber.value = state.settings.gstNumber;
  refs.settingsForm.gstNumber.required = Boolean(state.settings.gstEnabled);
  refs.settingsGstNumberField.classList.toggle('hidden', !state.settings.gstEnabled);
  refs.settingsForm.restaurantName.value = state.settings.restaurantName;
  refs.settingsForm.receiptFooter.value = state.settings.receiptFooter;
  refs.settingsForm.defaultDiscount.value = state.settings.defaultDiscount;
  refs.settingsForm.tableCount.value = state.settings.tableCount;
  refs.settingsForm.glassMode.value = state.settings.glassMode;
  refs.settingsForm.themeMode.value = state.settings.themeMode;
  refs.settingsForm.autoPrintOnClose.checked = Boolean(state.settings.autoPrintOnClose);
  document.documentElement.dataset.glass = state.settings.glassMode;
  document.documentElement.dataset.theme = state.settings.themeMode;

  refs.settingsRestaurantName.textContent = restaurantName;
  refs.settingsSetupState.textContent = state.settings.setupCompletedAt ? 'Configured' : 'Needs setup';

  if (state.settings.restaurantLogoDataUrl) {
    refs.logoPreview.innerHTML = logoMarkup(state.settings.restaurantLogoDataUrl, `${restaurantName} logo`, 'brand-logo');
    refs.clearLogoButton.disabled = false;
  } else {
    refs.logoPreview.innerHTML = '<div class="logo-placeholder">Optional logo</div>';
    refs.clearLogoButton.disabled = true;
  }

  refs.backupSnapshot.innerHTML = `
    <div class="shift-item"><span class="muted">Open drafts</span><strong>${state.tables.filter((table) => table.order?.items?.length).length}</strong></div>
    <div class="shift-item"><span class="muted">Bills stored</span><strong>${state.billHistory.length}</strong></div>
    <div class="shift-item"><span class="muted">Menu dishes</span><strong>${state.menu.length}</strong></div>
    <div class="shift-item"><span class="muted">Tables</span><strong>${state.settings.tableCount}</strong></div>
  `;

  const categories = [...new Set(state.menu.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  refs.menuCatalogMeta.innerHTML = `
    <span>${state.menu.length} dishes</span>
    <span>${categories.length} categories</span>
  `;

  refs.menuCatalogList.innerHTML = state.menu.length ? state.menu.map((item) => `
    <button class="menu-admin-row ${selectedMenuItem?.id === item.id ? 'is-active' : ''}" type="button" data-menu-editor-id="${item.id}">
      <div>
        <small>${escapeHtml(item.code)} � ${escapeHtml(item.category)}</small>
        <h4>${escapeHtml(item.name)}</h4>
      </div>
      <div class="menu-admin-meta">
        <span class="badge ${item.type}">${item.type === 'veg' ? 'Veg' : 'Non-Veg'}</span>
        <strong>${formatCurrency(item.price)}</strong>
      </div>
    </button>
  `).join('') : refs.emptyStateTemplate.innerHTML;

  refs.menuEditorTitle.textContent = selectedMenuItem ? `Edit ${selectedMenuItem.name}` : 'Add a new dish';
  refs.menuEditorCaption.textContent = selectedMenuItem
    ? 'Update pricing, category, note, and type for this dish.'
    : 'Build your menu locally. New dishes are available immediately across the floor.';

  const selectedCategory = selectedMenuItem?.category || refs.menuEditorForm.category.value || categories[0] || 'General';
  const categoryOptions = categories.includes(selectedCategory)
    ? categories
    : [selectedCategory, ...categories];
  refs.menuEditorForm.category.innerHTML = categoryOptions.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');

  refs.menuEditorForm.code.value = selectedMenuItem?.code ?? '';
  refs.menuEditorForm.name.value = selectedMenuItem?.name ?? '';
  refs.menuEditorForm.category.value = selectedCategory;
  refs.menuEditorForm.price.value = selectedMenuItem?.price ?? '';
  refs.menuEditorForm.type.value = selectedMenuItem?.type ?? 'veg';
  refs.menuEditorForm.note.value = selectedMenuItem?.note ?? '';
  refs.deleteDishButton.disabled = !selectedMenuItem;
}

function renderReceipt(state, refs) {
  const receipt = state.activeReceipt;
  const markup = buildReceiptMarkup(receipt);
  refs.receiptPrintArea.innerHTML = markup;

  refs.receiptPreviewPanel.classList.toggle('hidden', !receipt);
  refs.printSelectedReceiptButton.disabled = !receipt;
  refs.closeReceiptPreviewButton.disabled = !receipt;
  refs.receiptPreview.innerHTML = receipt
    ? markup
    : '<div class="empty-state"><h4>No receipt selected</h4><p class="muted">Tap any bill in history to preview, print, or send it to a paired Bluetooth printer.</p></div>';
}

export function renderApp(state, refs) {
  refs.viewTitle.textContent = state.view === 'summary' ? 'Analytics and Bills' : state.view === 'settings' ? 'Settings and Menu' : 'Floor Service';
  refs.clearMoveModeButton.classList.toggle('hidden', !state.moveOrderFromTableId);
  refs.viewPanels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.view === state.view));
  refs.viewTriggers.forEach((button) => button.classList.toggle('is-active', button.dataset.viewTrigger === state.view));
  renderLaunch(state, refs);
  renderBranding(state, refs);
  renderShiftSnapshot(state, refs);
  renderStatusBar(state, refs);
  renderFloorFilters(state, refs);
  renderTables(state, refs);
  renderMenu(state, refs);
  renderOrder(state, refs);
  renderSummary(state, refs);
  renderSettings(state, refs);
  renderReceipt(state, refs);
}




