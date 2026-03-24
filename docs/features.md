# 🚀 Features Deep Dive

This document provides a detailed breakdown of the features implemented in the **AMP Restaurant POS**.

## 1. Service Floor Management
The floor view is the heart of the POS system. It provides a real-time overview of the restaurant's current state.

- **Table Cards**: Each card displays the table number, current bill total, and guests.
- **Status Indicators**:
  - `Empty` (White): Ready for new guests.
  - `Active` (Green): Currently dining.
  - `Closing` (Orange): Bill has been generated, awaiting payment.
- **Compact View**: For large floor plans, the compact mode collapses cards into simple squares to fit 40+ tables on a single screen.
- **Walk-ins**: Quickly open a temporary "Walk-in" table for quick service.

## 2. In-Table Workflow
When a table is selected, the "Order Drawer" opens.

- **Menu Tab**:
  - Categorized list of dishes.
  - Quick-search by name or dish code (e.g., "501").
  - Add/Remove items with a single tap.
- **Current Bill Tab**:
  - Review all items in the current draft.
  - Apply custom discounts (fixed amount or percentage).
  - Select payment modes (UPI, Cash, Card, Mixed).
  - Generate a formatted bill for the customer.

## 3. Analytics & Reporting
The Analytics Workspace provides business intelligence directly on the device.

- **Daily Dashboard**: Total sales, bill counts, and tax collected.
- **Payment Metrics**: Breakdown of revenue by payment mode.
- **Trend Charts**:
  - Day-over-Day comparison.
  - Month-over-Month growth.
- **Dish Trends**: Track which categories or individual dishes are trending up or down.

## 4. Settings & Menu Studio
Full control over the workstation identity and menu.

- **Branding**: Set the restaurant name, receipt footer, and upload a custom logo.
- **Menu Management**:
  - Define dish codes, names, categories, and prices.
  - Categorize dishes as Veg or Non-Veg.
  - Add internal notes for staff (e.g., "High margin signature item").
- **Printer Configuration**: Paired Bluetooth printer selection with auto-print capability.

## 5. Resilience & Data Protection
Built for the realities of busy hospitality environments.

- **Recovery Snapshots**: Every draft change is mirrored to a recovery journal. If the app is killed by the OS or the battery dies, the last state is restored immediately.
- **24-Hour Backup Rotation**: A background native service writes a full database export to the device's `Downloads` folder once a day. These files survive app deletion.

---

*For more technical details, refer to the [Architecture Documentation](../README.md).*
