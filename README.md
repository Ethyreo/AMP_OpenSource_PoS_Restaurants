# 🍽️ AMP Restaurant POS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Android](https://img.shields.io/badge/Platform-Android-3DDC84.svg?logo=android&logoColor=white)](https://www.android.com/)
[![Tech: PWA](https://img.shields.io/badge/Tech-PWA-blue.svg)](https://web.dev/progressive-web-apps/)

**AMP Restaurant POS** is a high-performance, local-first Point of Sale system designed specifically for Android tablets and handhelds. Built with a "never-down" architecture, it ensures your restaurant continues to operate smoothly even without an internet connection.

---

## ✨ Key Features

### 🏢 Floor Management
*   **Dynamic Floor View**: Toggle between detailed table cards and a high-density compact grid.
*   **Real-time Table States**: Color-coded status for Empty, Active, and Closing tables.
*   **Seat Management**: Detailed tracking of guests and orders per table.

### 💳 Modern Billing & Orders
*   **Split Payments**: Native support for splitting bills by amount or items.
*   **GST Integration**: Toggle GST on/off with custom tax ID support on receipts.
*   **Menu Studio**: In-app dish management with category sorting and dynamic pricing.
*   **In-Table Workflow**: Fast-switching between "Menu" and "Current Bill" tabs for rapid order entry.

### 📊 Professional Analytics
*   **Financial Insights**: Daily totals, payment breakdowns, and bill history.
*   **Trend Analysis**: Compare performance day-over-day or month-over-month.
*   **Dish Performance**: Identify your best-selling items and revenue drivers.

### 🛡️ Reliability & Backup
*   **Offline-First**: All data, logic, and assets are stored locally on-device.
*   **Recovery Journaling**: Frequent state snapshots to prevent data loss on crashes.
*   **24-Hour Native Backups**: Automatic JSON exports to `Downloads/KenPoS` that survive app uninstalls.
*   **Native Printing**: Direct support for Bluetooth thermal printers and Android Print Service.

---

## 🛠️ Technology Stack

*   **Logic & UI**: Pure Vanilla JavaScript, HTML5, and CSS3 (Zero external dependencies for maximum speed).
*   **Storage**: Browser `IndexedDB` for high-speed local data persistence.
*   **Wrapper**: Android Studio WebView Shell with `WebViewAssetLoader` for local asset serving.
*   **Bridges**: Custom Java-to-JavaScript bridges for low-level hardware access (Bluetooth, File System).

---

## 📂 Project Structure

```text
├── android-shell/     # Android Studio project source (Java/Gradle)
├── app/               # Web application logic, styles, and scripts
├── docs/              # Product specifications and developer notes
├── index.html         # Main entry point for the PWA
├── manifest.webmanifest # PWA configuration
└── sync-web-assets.ps1 # Build utility to sync web assets to Android
```

---

## 🚀 Getting Started

### Prerequisites
*   [Android Studio Koala+](https://developer.android.com/studio)
*   An Android device or emulator (API 26+)

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Ethyreo/AMP_OpenSource_PoS_Restaurants.git
    cd AMP_OpenSource_PoS_Restaurants
    ```
2.  **Sync Web Assets**:
    Run the PowerShell script to bundle the latest web files into the Android project:
    ```powershell
    .\sync-web-assets.ps1
    ```
3.  **Build & Run**:
    Open the `android-shell/` folder in Android Studio and hit **Run**.

---

## 🏗️ Architecture Overview

The system operates as a **Hybrid PWA**. The core application logic lives in the `app/` directory and is served locally by the Android shell. This hybrid approach combines the rapid development of web technologies with the hardware stability of native Android.

For detailed notes on data schema and print implementation, see [docs/architecture/README.md](docs/architecture/README.md).

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built by Gurman Singh**
