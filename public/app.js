// ── 作品設定 ──────────────────────────────────────────────────
// name: 對應 image-targets 資料夾名稱
// title, desc: 顯示在卡片上的文字
// url: 點擊按鈕後開啟的網頁
const ARTWORKS = [
  {
    name: 'artwork-01',
    title: '世界は一つ',
    desc: '湯川秀樹',
    url: 'calligraphy-ar.vercel.app',  // ← 改成你的網址
  },
  // 新增更多作品：複製上面的格式貼在這裡
]

// ── UI 元素 ───────────────────────────────────────────────────
const scanHint     = document.getElementById('scan-hint')
const reticle      = document.getElementById('target-reticle')
const overlay      = document.getElementById('ar-overlay')
const artworkTitle = document.getElementById('artwork-title')
const artworkDesc  = document.getElementById('artwork-desc')
const artworkLink  = document.getElementById('artwork-link')

function showOverlay(artwork) {
  artworkTitle.textContent = artwork.title
  artworkDesc.textContent  = artwork.desc
  artworkLink.href         = artwork.url
  overlay.classList.add('visible')
  scanHint.style.opacity   = '0'
  reticle.classList.add('found')
}

function hideOverlay() {
  overlay.classList.remove('visible')
  scanHint.style.opacity = '1'
  reticle.classList.remove('found')
}

// ── 8th Wall 初始化 ───────────────────────────────────────────
function onXrLoaded() {
  // 載入所有 image target JSON
  const fetches = ARTWORKS.map((a) =>
    fetch(`./image-targets/${a.name}/${a.name}.json`).then((r) => r.json())
  )

  Promise.all(fetches).then((targets) => {
    XR8.XrController.configure({
      imageTargetData: targets,
      disableWorldTracking: true,  // 純圖像辨識，省電
    })

    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.XrController.pipelineModule(),
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule(),
      buildImageTargetModule(),
    ])

    XR8.run({ canvas: document.getElementById('xr-canvas') })
  }).catch((err) => {
    console.error('載入 image target 失敗:', err)
    alert('載入失敗，請檢查 image-targets 資料夾是否正確')
  })
}

// ── 圖像辨識模組 ──────────────────────────────────────────────
function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',

    onAttach() {
      reticle.style.display = 'block'
    },

    listeners: [
      {
        event: 'reality.imagefound',
        process({ detail }) {
          const artwork = ARTWORKS.find((a) => a.name === detail.name)
          if (artwork) showOverlay(artwork)
        },
      },
      {
        event: 'reality.imageupdated',
        process({ detail }) {
          const artwork = ARTWORKS.find((a) => a.name === detail.name)
          if (artwork && !overlay.classList.contains('visible')) {
            showOverlay(artwork)
          }
        },
      },
      {
        event: 'reality.imagelost',
        process() {
          hideOverlay()
        },
      },
    ],
  }
}

// ── 啟動 ──────────────────────────────────────────────────────
if (window.XR8) {
  onXrLoaded()
} else {
  window.addEventListener('xrloaded', onXrLoaded, { once: true })
}
