function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateTotals(order, settings) {
  const items = order?.items ?? [];
  const subtotal = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const discount = round2(Math.max(0, Number(order?.discount ?? settings.defaultDiscount ?? 0)));
  const baseAmount = round2(Math.max(0, subtotal - discount));
  const serviceChargeRate = Number(settings.serviceChargeRate ?? 5);
  const gstEnabled = Boolean(settings.gstEnabled);
  const gstRate = gstEnabled ? Number(settings.gstRate ?? 5) : 0;
  const serviceCharge = round2(baseAmount * (serviceChargeRate / 100));
  const gst = round2((baseAmount + serviceCharge) * (gstRate / 100));
  const beforeRound = round2(baseAmount + serviceCharge + gst);
  const total = Math.round(beforeRound);

  return {
    subtotal,
    discount,
    baseAmount,
    serviceChargeRate,
    gstEnabled,
    gstRate,
    gst,
    serviceCharge,
    beforeRound,
    roundOff: round2(total - beforeRound),
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
