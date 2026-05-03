// ── 設定 ──────────────────────────────────────────────────────
var ARTWORK_NAME = 'artwork-01'
var STORY_URL = 'https://calligraphy-ar.vercel.app/'
var YUKAWA_IMAGE = './yukawa.png'
var APPEAR_MIN = 4
var APPEAR_MAX = 8
var TRIGGER_DISTANCE = 1.5

var DIALOGS = [
  '……你來了。我在這裡等了很久。',
  '這幅字，是我晚年寫下的。世界是一體的——不論是原子，還是人心。',
  '當年我們劈開了原子，卻沒能劈開人與人之間的隔閡。',
  '現在，這個選擇交給你了。你願意繼續往下看嗎？',
]

// ── 狀態 ──────────────────────────────────────────────────────
var state = {
  artworkFound: false,
  yukawaPlaced: false,
  dialogStarted: false,
  dialogIndex: 0,
  typing: false,
}

// ── UI ────────────────────────────────────────────────────────
var scanHint   = document.getElementById('scan-hint')
var foundHint  = document.getElementById('found-hint')
var dialogBox  = document.getElementById('dialog-box')
var dialogText = document.getElementById('dialog-text')
var dialogNext = document.getElementById('dialog-next')
var enterBtn   = document.getElementById('enter-btn')

// ── 對話系統 ──────────────────────────────────────────────────
var typingTimer = null

function typeText(text) {
  state.typing = true
  dialogNext.style.display = 'none'
  dialogText.innerHTML = ''
  var i = 0
  typingTimer = setInterval(function() {
    if (i < text.length) {
      dialogText.innerHTML = text.slice(0, i + 1) + '<span class="dialog-cursor"></span>'
      i++
    } else {
      clearInterval(typingTimer)
      dialogText.innerHTML = text
      state.typing = false
      dialogNext.style.display = 'block'
    }
  }, 65)
}

function showNextDialog() {
  if (state.typing) {
    clearInterval(typingTimer)
    dialogText.innerHTML = DIALOGS[state.dialogIndex - 1] || ''
    state.typing = false
    dialogNext.style.display = 'block'
    return
  }
  if (state.dialogIndex >= DIALOGS.length) {
    dialogBox.classList.remove('visible')
    enterBtn.style.display = 'block'
    return
  }
  typeText(DIALOGS[state.dialogIndex++])
}

document.addEventListener('click', function(e) {
  if (e.target.id === 'start-btn' || e.target.id === 'enter-btn') return
  if (state.dialogStarted) { showNextDialog(); return }

  // 點螢幕對焦
  var video = document.querySelector('video')
  if (video && video.srcObject) {
    var track = video.srcObject.getVideoTracks()[0]
    if (track && track.getCapabilities) {
      var caps = track.getCapabilities()
      if (caps.focusMode) {
        track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] })
      }
    }
  }
})

// ── Three.js 場景（獨立 canvas） ──────────────────────────────
var threeRenderer, threeScene, threeCamera
var yukawaMesh = null
var glowMesh = null
var yukawaPos = { x: 0, z: 0 }
var cameraPos = { x: 0, y: 0, z: 0 }
var cameraQuat = { x: 0, y: 0, z: 0, w: 1 }
var cameraProjection = null

function initThree() {
  var canvas = document.getElementById('three-canvas')
  var w = window.innerWidth
  var h = window.innerHeight
  var dpr = window.devicePixelRatio || 1

  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'

  threeRenderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  })
  threeRenderer.setPixelRatio(dpr)
  threeRenderer.setSize(w, h)
  threeRenderer.setClearColor(0x000000, 0)

  threeScene = new THREE.Scene()
  threeCamera = new THREE.PerspectiveCamera(60, w / h, 0.01, 1000)
  threeScene.add(new THREE.AmbientLight(0xffffff, 2))

  // 載入湯川 PNG
  var loader = new THREE.TextureLoader()
  loader.load(YUKAWA_IMAGE, function(tex) {
    var aspect = tex.image.width / tex.image.height
    var h2 = 1.7
    var geo = new THREE.PlaneGeometry(h2 * aspect, h2)
    var mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true,
      side: THREE.DoubleSide, depthWrite: false,
    })
    yukawaMesh = new THREE.Mesh(geo, mat)
    yukawaMesh.visible = false
    threeScene.add(yukawaMesh)

    // 光暈
    var gGeo = new THREE.CircleGeometry(0.7, 32)
    var gMat = new THREE.MeshBasicMaterial({
      color: 0xffd764, transparent: true,
      opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
    })
    glowMesh = new THREE.Mesh(gGeo, gMat)
    glowMesh.rotation.x = -Math.PI / 2
    glowMesh.visible = false
    threeScene.add(glowMesh)
  })

  // 開始 render loop
  requestAnimationFrame(renderLoop)
}

function renderLoop() {
  requestAnimationFrame(renderLoop)

  // 同步相機姿態（由 XR8 pipeline 更新）
  threeCamera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
  threeCamera.quaternion.set(cameraQuat.x, cameraQuat.y, cameraQuat.z, cameraQuat.w)
  if (cameraProjection) {
    threeCamera.projectionMatrix.fromArray(cameraProjection)
    threeCamera.projectionMatrixInverse.copy(threeCamera.projectionMatrix).invert()
  }

  // 光暈閃爍
  if (glowMesh && glowMesh.visible) {
    glowMesh.material.opacity = 0.12 + Math.sin(Date.now() * 0.003) * 0.07
  }

  // 人物面向相機
  if (yukawaMesh && yukawaMesh.visible) {
    yukawaMesh.lookAt(cameraPos.x, yukawaMesh.position.y, cameraPos.z)
  }

  threeRenderer.render(threeScene, threeCamera)
}

function onResize() {
  var w = window.innerWidth
  var h = window.innerHeight
  var dpr = window.devicePixelRatio || 1
  var canvas = document.getElementById('three-canvas')
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  if (threeRenderer) threeRenderer.setSize(w, h)
  if (threeCamera) {
    threeCamera.aspect = w / h
    threeCamera.updateProjectionMatrix()
  }
}

// ── XR8 Camera 姿態同步模組 ──────────────────────────────────
function cameraSyncModule() {
  return {
    name: 'camera-sync',
    onUpdate: function(args) {
      if (!args.processCpuResult || !args.processCpuResult.reality) return
      var r = args.processCpuResult.reality
      if (r.position) {
        cameraPos.x = r.position.x
        cameraPos.y = r.position.y
        cameraPos.z = r.position.z
      }
      if (r.rotation) {
        cameraQuat.x = r.rotation.x
        cameraQuat.y = r.rotation.y
        cameraQuat.z = r.rotation.z
        cameraQuat.w = r.rotation.w
      }
      if (r.intrinsics) {
        cameraProjection = r.intrinsics
      }
    },
  }
}

// ── 放置湯川 ─────────────────────────────────────────────────
function placeYukawa() {
  if (!yukawaMesh) { setTimeout(placeYukawa, 300); return }

  var angle = Math.random() * Math.PI * 2
  var dist = APPEAR_MIN + Math.random() * (APPEAR_MAX - APPEAR_MIN)
  yukawaPos.x = cameraPos.x + Math.sin(angle) * dist
  yukawaPos.z = cameraPos.z - Math.cos(angle) * dist

  yukawaMesh.position.set(yukawaPos.x, 0.85, yukawaPos.z)
  yukawaMesh.visible = true

  if (glowMesh) {
    glowMesh.position.set(yukawaPos.x, 0.01, yukawaPos.z)
    glowMesh.visible = true
  }

  state.yukawaPlaced = true
  scanHint.style.display = 'none'
  foundHint.style.display = 'block'
  setTimeout(function() {
    foundHint.style.transition = 'opacity 1s'
    foundHint.style.opacity = '0'
    setTimeout(function() { foundHint.style.display = 'none' }, 1000)
  }, 4000)

  // 偵測靠近
  var check = setInterval(function() {
    if (state.dialogStarted) { clearInterval(check); return }
    var dx = cameraPos.x - yukawaPos.x
    var dz = cameraPos.z - yukawaPos.z
    if (Math.sqrt(dx*dx + dz*dz) < TRIGGER_DISTANCE) {
      clearInterval(check)
      state.dialogStarted = true
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      dialogBox.classList.add('visible')
      showNextDialog()
    }
  }, 400)
}

// ── Image Target 模組 ─────────────────────────────────────────
function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          if (state.artworkFound || e.detail.name !== ARTWORK_NAME) return
          state.artworkFound = true
          if (navigator.vibrate) navigator.vibrate(200)
          setTimeout(placeYukawa, 1500)
        },
      },
    ],
  }
}

// ── 8th Wall 初始化 ───────────────────────────────────────────
var targetDataLoaded = []

fetch('./image-targets/' + ARTWORK_NAME + '/' + ARTWORK_NAME + '.json')
  .then(function(r) {
    if (!r.ok) throw new Error('找不到 JSON')
    return r.json()
  })
  .then(function(data) { targetDataLoaded = [data] })
  .catch(function(err) {
    if (scanHint) scanHint.innerHTML = '<p style="color:red;">錯誤：' + err.message + '</p>'
  })

function onxrloaded() {
  if (targetDataLoaded.length === 0) { setTimeout(onxrloaded, 200); return }

  XR8.XrController.configure({
    imageTargetData: targetDataLoaded,
    disableWorldTracking: false,
  })

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.XrController.pipelineModule(),
    cameraSyncModule(),
    buildImageTargetModule(),
  ])

  XR8.run({ canvas: document.getElementById('xr-canvas') })
}

// ── Canvas 尺寸（xr-canvas） ──────────────────────────────────
function resizeXrCanvas() {
  var canvas = document.getElementById('xr-canvas')
  var dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
}

// ── 啟動 ──────────────────────────────────────────────────────
function startAR() {
  document.getElementById('start-screen').style.display = 'none'
  scanHint.style.display = 'block'

  resizeXrCanvas()
  initThree()

  window.addEventListener('resize', function() {
    resizeXrCanvas()
    onResize()
  })
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(function() { resizeXrCanvas(); onResize() }, 200)
  })

  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
enterBtn.addEventListener('click', function() { window.location.href = STORY_URL })
