var ARTWORKS = [
  {
    name: 'artwork-01',
    title: '世界は一つ',
    desc: '湯川秀樹',
    url: 'https://calligraphy-ar.vercel.app/',
  },
]

var overlay = document.getElementById('ar-overlay')
var artworkTitle = document.getElementById('artwork-title')
var artworkDesc = document.getElementById('artwork-desc')
var artworkLink = document.getElementById('artwork-link')
var scanHint = document.getElementById('scan-hint')
var focusBtn = document.getElementById('focus-btn')

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

// 對焦按鈕
focusBtn.addEventListener('click', function() {
  focusBtn.classList.add('focusing')
  setTimeout(function() { focusBtn.classList.remove('focusing') }, 500)
  // 觸發相機重新對焦（部分裝置支援）
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var video = document.querySelector('video')
    if (video && video.srcObject) {
      var track = video.srcObject.getVideoTracks()[0]
      if (track && track.getCapabilities && track.getCapabilities().focusMode) {
        track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] })
      }
    }
  }
})

function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          for (var i = 0; i < ARTWORKS.length; i++) {
            if (ARTWORKS[i].name === e.detail.name) {
              showOverlay(ARTWORKS[i]); break
            }
          }
        },
      },
      {
        event: 'reality.imagelost',
        process: function() { hideOverlay() },
      },
    ],
  }
}

var targetDataLoaded = []

var fetchPromises = ARTWORKS.map(function(a) {
  return fetch('./image-targets/' + a.name + '/' + a.name + '.json')
    .then(function(r) {
      if (!r.ok) throw new Error('找不到 JSON: ' + a.name)
      return r.json()
    })
})

Promise.all(fetchPromises)
  .then(function(results) { targetDataLoaded = results })
  .catch(function(err) {
    document.getElementById('scan-hint').innerHTML =
      '<p style="color:red;">錯誤：' + err.message + '</p>'
  })

function onxrloaded() {
  if (targetDataLoaded.length === 0) { setTimeout(onxrloaded, 200); return }
  XR8.XrController.configure({
    imageTargetData: targetDataLoaded,
    disableWorldTracking: true,
  })
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.XrController.pipelineModule(),
    buildImageTargetModule(),
  ])
  XR8.run({ canvas: document.getElementById('xr-canvas') })
}

function resizeCanvas() {
  var canvas = document.getElementById('xr-canvas')
  var dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
}

function startAR() {
  document.getElementById('start-screen').style.display = 'none'
  scanHint.style.display = 'block'
  focusBtn.style.display = 'block'

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(resizeCanvas, 200)
  })

  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
