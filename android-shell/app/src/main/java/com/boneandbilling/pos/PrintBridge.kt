package com.boneandbilling.pos

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient

class PrintBridge(private val context: Context) {

    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun printReceipt(html: String, title: String) {
        mainHandler.post {
            val wrappedHtml = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <style>
                        body { font-family: monospace; background: white; color: black; margin: 0; padding: 16px; }
                        .receipt-sheet { width: 80mm; margin: 0 auto; }
                        .receipt-divider { border-top: 1px dashed #333; margin: 12px 0; }
                        .receipt-row { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
                        .receipt-items { display: grid; gap: 6px; }
                        h2, p { text-align: center; margin: 4px 0; }
                    </style>
                </head>
                <body>$html</body>
                </html>
            """.trimIndent()

            val printWebView = WebView(context)
            printWebView.settings.javaScriptEnabled = false
            printWebView.settings.domStorageEnabled = false
            printWebView.settings.allowFileAccess = false
            printWebView.settings.allowContentAccess = false
            printWebView.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    val printManager = context.getSystemService(Context.PRINT_SERVICE) as PrintManager
                    val jobName = if (title.isBlank()) "AMP PoS Receipt" else title
                    val adapter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        printWebView.createPrintDocumentAdapter(jobName)
                    } else {
                        @Suppress("DEPRECATION")
                        printWebView.createPrintDocumentAdapter()
                    }
                    printManager.print(
                        jobName,
                        adapter,
                        PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.UNKNOWN_PORTRAIT)
                            .build()
                    )
                }
            }
            printWebView.loadDataWithBaseURL(
                "https://appassets.androidplatform.net/",
                wrappedHtml,
                "text/html",
                "utf-8",
                null
            )
        }
    }
}

