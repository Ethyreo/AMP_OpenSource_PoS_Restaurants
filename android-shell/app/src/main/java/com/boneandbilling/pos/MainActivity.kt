package com.boneandbilling.pos

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.boneandbilling.pos.databinding.ActivityMainBinding
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileChooserCallback
        fileChooserCallback = null
        val resultUris = if (result.resultCode == RESULT_OK) {
            when {
                result.data?.clipData != null -> {
                    val clipData = result.data!!.clipData!!
                    Array(clipData.itemCount) { index -> clipData.getItemAt(index).uri }
                }
                result.data?.data != null -> arrayOf(result.data!!.data!!)
                else -> null
            }
        } else {
            null
        }
        callback?.onReceiveValue(resultUris)
    }

    private val logoPickerLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri == null) {
            dispatchCustomEvent("native-logo-selection-cancelled", JSONObject())
            return@registerForActivityResult
        }

        try {
            val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() }
            if (bytes == null || bytes.isEmpty()) {
                dispatchCustomEvent("native-logo-selection-error", JSONObject().put("message", "Selected image could not be read."))
                return@registerForActivityResult
            }
            val mimeType = contentResolver.getType(uri) ?: "image/png"
            val dataUrl = "data:$mimeType;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
            dispatchCustomEvent("native-logo-selected", JSONObject().put("dataUrl", dataUrl))
        } catch (error: Exception) {
            dispatchCustomEvent("native-logo-selection-error", JSONObject().put("message", error.message ?: "Unable to read the selected image."))
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        BackupScheduler.schedule(applicationContext)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        with(binding.webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        binding.webView.addJavascriptInterface(AndroidHostBridge(this), "AndroidHost")
        binding.webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest) =
                assetLoader.shouldInterceptRequest(request.url)
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback

                return try {
                    val chooserIntent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                    }
                    fileChooserLauncher.launch(chooserIntent)
                    true
                } catch (_: Exception) {
                    fileChooserCallback = null
                    false
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                if (consoleMessage != null) {
                    Log.d(
                        "AMPPOS",
                        "${consoleMessage.message()} @ ${consoleMessage.sourceId()}:${consoleMessage.lineNumber()}"
                    )
                }
                return super.onConsoleMessage(consoleMessage)
            }
        }

        if (savedInstanceState == null) {
            binding.webView.loadUrl("https://appassets.androidplatform.net/assets/web/index.html")
        } else {
            binding.webView.restoreState(savedInstanceState)
        }
    }

    fun openLogoPicker() {
        logoPickerLauncher.launch("image/*")
    }

    private fun dispatchCustomEvent(name: String, detail: JSONObject) {
        binding.webView.post {
            val script = "window.dispatchEvent(new CustomEvent(${JSONObject.quote(name)}, { detail: ${detail} }));"
            binding.webView.evaluateJavascript(script, null)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.webView.saveState(outState)
    }

    override fun onBackPressed() {
        if (binding.webView.canGoBack()) {
            binding.webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
