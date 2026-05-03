// ── 設定 ──────────────────────────────────────────────────────
var ARTWORK_NAME = 'artwork-01'
var STORY_URL = 'https://calligraphy-ar.vercel.app/'
var YUKAWA_IMAGE = './yukawa.png'
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
  if (state.dialogStarted) { showNextDialog() }
})

// ── 倒數掃描 UI ───────────────────────────────────────────────
function showScanCountdown(onDone) {
  foundHint.style.display = 'block'
  foundHint.style.opacity = '1'
  foundHint.style.transition = ''
  foundHint.querySelector('p').textContent = '請將手機環繞展場緩慢掃描...'

  var cdEl = document.createElement('div')
  cdEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:300;text-align:center;pointer-events:none;'

  var numEl = document.createElement('div')
  numEl.style.cssText = 'font-size:88px;font-weight:700;color:#ffd764;line-height:1;text-shadow:0 0 40px rgba(255,215,100,0.9);font-family:sans-serif;'

  var labelEl = document.createElement('div')
  labelEl.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.55);margin-top:10px;letter-spacing:0.2em;font-family:sans-serif;'
  labelEl.textContent = '掃描中'

  cdEl.appendChild(numEl)
  cdEl.appendChild(labelEl)
  document.body.appendChild(cdEl)

  var count = 5
  numEl.textContent = count

  var timer = setInterval(function() {
    count--
    if (count <= 0) {
      clearInterval(timer)
      cdEl.remove()
      foundHint.style.transition = 'opacity 0.5s'
      foundHint.style.opacity = '0'
      setTimeout(function() { foundHint.style.display = 'none'; onDone() }, 500)
    } else {
      numEl.textContent = count
    }
  }, 1000)
}

// ── Three.js + XR8 SLAM ───────────────────────────────────────
var renderer, scene, camera
var yukawaMesh = null
var glowMesh = null
var yukawaWorldPos = new THREE.Vector3()
var camPos = new THREE.Vector3()
var camQuat = new THREE.Quaternion()
var projMatrix = new THREE.Matrix4()
var hasProjection = false

function initThree() {
  var canvas = document.getElementById('three-canvas')
  resizeThreeCanvas(canvas)

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  })
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.001,
    1000
  )
  scene.add(camera)
  scene.add(new THREE.AmbientLight(0xffffff, 2.5))

  loadYukawa()
  renderLoop()
}

function resizeThreeCanvas(canvas) {
  var dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
}

function loadYukawa() {
  // 先建紅色方塊（確保一定有東西）
  var geo = new THREE.BoxGeometry(0.6, 1.7, 0.05)
  var mat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
  yukawaMesh = new THREE.Mesh(geo, mat)
  yukawaMesh.visible = false
  scene.add(yukawaMesh)

  // 光暈
  var gGeo = new THREE.CircleGeometry(0.6, 32)
  var gMat = new THREE.MeshBasicMaterial({
    color: 0xffd764, transparent: true,
    opacity: 0.2, side: THREE.DoubleSide, depthWrite: false,
  })
  glowMesh = new THREE.Mesh(gGeo, gMat)
  glowMesh.rotation.x = -Math.PI / 2
  glowMesh.visible = false
  scene.add(glowMesh)

  // 嘗試載入 PNG
  var loader = new THREE.TextureLoader()
  loader.load(YUKAWA_IMAGE, function(tex) {
    var aspect = tex.image.width / tex.image.height
    var h = 1.7
    var pGeo = new THREE.PlaneGeometry(h * aspect, h)
    var pMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true,
      side: THREE.DoubleSide, depthWrite: false,
    })
    var newMesh = new THREE.Mesh(pGeo, pMat)
    newMesh.visible = yukawaMesh.visible
    newMesh.position.copy(yukawaMesh.position)
    scene.remove(yukawaMesh)
    yukawaMesh = newMesh
    scene.add(yukawaMesh)
  }, undefined, function() {
    console.log('PNG 載入失敗，使用紅色方塊')
  })
}

function renderLoop() {
  requestAnimationFrame(renderLoop)
  if (!renderer) return

  // 同步相機
  camera.position.copy(camPos)
  camera.quaternion.copy(camQuat)
  if (hasProjection) {
    camera.projectionMatrix.copy(projMatrix)
    camera.projectionMatrixInverse.copy(projMatrix).invert()
  }

  // 光暈動畫
  if (glowMesh && glowMesh.visible) {
    glowMesh.material.opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.08
  }

  // 人物面向相機（只轉 Y 軸）
  if (yukawaMesh && yukawaMesh.visible) {
    var dx = camPos.x - yukawaMesh.position.x
    var dz = camPos.z - yukawaMesh.position.z
    yukawaMesh.rotation.y = Math.atan2(dx, dz)
  }

  renderer.clear()
  renderer.render(scene, camera)
}

// ── XR8 Pipeline Module（同步相機姿態） ──────────────────────
function xrCameraModule() {
  return {
    name: 'xr-camera-sync',

    onStart: function(args) {
      // 用 XR8 給的 canvas 大小更新 renderer
      if (renderer) {
        renderer.setSize(args.canvasWidth, args.canvasHeight)
        camera.aspect = args.canvasWidth / args.canvasHeight
        camera.updateProjectionMatrix()
      }
    },

    onUpdate: function(args) {
      var r = args.processCpuResult && args.processCpuResult.reality
      if (!r) return

      if (r.position) camPos.set(r.position.x, r.position.y, r.position.z)
      if (r.rotation) camQuat.set(r.rotation.x, r.rotation.y, r.rotation.z, r.rotation.w)
      if (r.intrinsics) {
        projMatrix.fromArray(r.intrinsics)
        hasProjection = true
      }

      // 靠近偵測
      if (state.yukawaPlaced && !state.dialogStarted && yukawaMesh) {
        var dx = camPos.x - yukawaMesh.position.x
        var dz = camPos.z - yukawaMesh.position.z
        var dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < TRIGGER_DISTANCE) {
          state.dialogStarted = true
          if (navigator.vibrate) navigator.vibrate([100, 50, 100])
          setTimeout(function() {
            dialogBox.classList.add('visible')
            showNextDialog()
          }, 300)
        }
      }
    },

    onCanvasSizeChange: function(args) {
      if (renderer) {
        renderer.setSize(args.canvasWidth, args.canvasHeight)
        camera.aspect = args.canvasWidth / args.canvasHeight
        camera.updateProjectionMatrix()
      }
    },
  }
}

// ── 放置湯川 ─────────────────────────────────────────────────
function placeYukawa() {
  if (!yukawaMesh) { setTimeout(placeYukawa, 300); return }

  // 在相機前方隨機位置（4-8 公尺）
  var angle = Math.random() * Math.PI * 2
  var dist = 4 + Math.random() * 4
  var x = camPos.x + Math.sin(angle) * dist
  var z = camPos.z - Math.cos(angle) * dist

  yukawaMesh.position.set(x, 0, z)
  yukawaMesh.visible = true

  if (glowMesh) {
    glowMesh.position.set(x, -0.84, z)
    glowMesh.visible = true
  }

  yukawaWorldPos.set(x, 0, z)
  state.yukawaPlaced = true

  // 提示
  foundHint.querySelector('p').textContent = '湯川秀樹就在展場某處，試著找到他'
  foundHint.style.display = 'block'
  foundHint.style.opacity = '1'
  foundHint.style.transition = ''
  setTimeout(function() {
    foundHint.style.transition = 'opacity 1s'
    foundHint.style.opacity = '0'
    setTimeout(function() { foundHint.style.display = 'none' }, 1000)
  }, 3500)
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
          scanHint.style.display = 'none'
          showScanCountdown(function() { placeYukawa() })
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
    disableWorldTracking: false,  // 需要 SLAM
  })

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.XrController.pipelineModule(),
    xrCameraModule(),
    buildImageTargetModule(),
  ])

  XR8.run({ canvas: document.getElementById('xr-canvas') })
}

// ── Canvas ────────────────────────────────────────────────────
function resizeXrCanvas() {
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

  resizeXrCanvas()
  initThree()

  window.addEventListener('resize', function() {
    resizeXrCanvas()
    resizeThreeCanvas(document.getElementById('three-canvas'))
  })
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(function() {
      resizeXrCanvas()
      resizeThreeCanvas(document.getElementById('three-canvas'))
    }, 200)
  })

  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
enterBtn.addEventListener('click', function() { window.location.href = STORY_URL })
