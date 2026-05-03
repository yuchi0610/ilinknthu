var ARTWORKS = [
  {
    name: 'artwork-01',
    title: '世界は一つ',
    desc: '湯川秀樹',
    url: 'https://calligraphy-ar.vercel.app/',
  },
]

var scanHint = document.getElementById('scan-hint')
var reticle = document.getElementById('target-reticle')
var overlay = document.getElementById('ar-overlay')
var artworkTitle = document.getElementById('artwork-title')
var artworkDesc = document.getElementById('artwork-desc')
var artworkLink = document.getElementById('artwork-link')

function log(msg) {
  var el = document.getElementById('log')
  if (el) el.innerHTML += '<div>' + new Date().toISOString().slice(11,19) + ' ' + msg + '</div>'
  console.log(msg)
}

function showOverlay(artwork) {
  artworkTitle.textContent = artwork.title
  artworkDesc.textContent = artwork.desc
  artworkLink.href = artwork.url
  overlay.classList.add('visible')
  scanHint.style.opacity = '0'
}

function hideOverlay() {
  overlay.classList.remove('visible')
  scanHint.style.opacity = '1'
}

function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          log('辨識到: ' + e.detail.name)
          for (var i = 0; i < ARTWORKS.length; i++) {
            if (ARTWORKS[i].name === e.detail.name) {
              showOverlay(ARTWORKS[i]); break
            }
          }
        },
      },
      {
        event: 'reality.imagelost',
        process: function() {
          log('目標消失')
          hideOverlay()
        },
      },
    ],
  }
}

var targetDataLoaded = []

log('開始 fetch image target JSON')

var fetchPromises = ARTWORKS.map(function(a) {
  return fetch('./image-targets/' + a.name + '/' + a.name + '.json')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + a.name + '.json')
      return r.json()
    })
    .then(function(data) {
      log('JSON 載入成功: ' + a.name)
      return data
    })
})

Promise.all(fetchPromises)
  .then(function(results) {
    targetDataLoaded = results
    log('所有 JSON 載入完成，共 ' + results.length + ' 個')
  })
  .catch(function(err) {
    log('JSON 載入失敗: ' + err.message)
    document.getElementById('scan-hint').innerHTML =
      '<p style="color:red;padding:16px;font-size:14px;">錯誤：' + err.message + '</p>'
  })

function onxrloaded() {
  log('onxrloaded 被呼叫，targetDataLoaded 長度: ' + targetDataLoaded.length)
  if (targetDataLoaded.length === 0) {
    log('JSON 未就緒，200ms 後重試')
    setTimeout(onxrloaded, 200)
    return
  }
  log('開始設定 XR8')
  XR8.XrController.configure({
    imageTargetData: targetDataLoaded,
    disableWorldTracking: true,
  })
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.XrController.pipelineModule(),
    buildImageTargetModule(),
  ])
  log('呼叫 XR8.run')
  XR8.run({ canvas: document.getElementById('xr-canvas') })
  log('XR8.run 完成')
}

function startAR() {
  log('startAR 被呼叫')
  log('window.XR8 = ' + (window.XR8 ? '已載入' : '未載入'))
  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}
