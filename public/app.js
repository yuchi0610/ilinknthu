// ── 設定 ──────────────────────────────────────────────────────
var ARTWORK = {
  name: 'artwork-01',
  title: '世界は一つ',
  desc: '湯川秀樹',
}

var STORY_URL = 'https://example.com'  // ← 之後換成你的網址

// 湯川對話內容
var DIALOGS = [
  '……你來了。我在這裡等了很久。',
  '這幅字，是我晚年寫下的。世界是一體的——不論是原子，還是人心。',
  '當年我們劈開了原子，卻沒能劈開人與人之間的隔閡。',
  '現在，這個選擇交給你了。你願意繼續往下看嗎？',
]

// 湯川 PNG 圖片路徑（放在 public/ 資料夾）
var YUKAWA_IMAGE = './yukawa.png'

// 湯川出現的距離範圍（公尺）
var APPEAR_MIN = 4
var APPEAR_MAX = 8

// 觸發對話的距離（公尺）
var TRIGGER_DISTANCE = 1.5

// ── 狀態 ──────────────────────────────────────────────────────
var state = {
  artworkFound: false,
  yukawaPlaced: false,
  dialogStarted: false,
  dialogIndex: 0,
  typing: false,
  yukawaPosition: null,  // {x, z} 公尺
}

// ── UI 元素 ───────────────────────────────────────────────────
var scanHint   = document.getElementById('scan-hint')
var foundHint  = document.getElementById('found-hint')
var dialogBox  = document.getElementById('dialog-box')
var dialogText = document.getElementById('dialog-text')
var dialogNext = document.getElementById('dialog-next')
var enterBtn   = document.getElementById('enter-btn')

// ── 對話系統 ──────────────────────────────────────────────────
var typingTimer = null

function typeText(text, callback) {
  state.typing = true
  dialogNext.style.display = 'none'
  dialogText.innerHTML = ''
  var i = 0
  var cursor = '<span class="dialog-cursor"></span>'

  typingTimer = setInterval(function() {
    if (i < text.length) {
      dialogText.innerHTML = text.slice(0, i + 1) + cursor
      i++
    } else {
      clearInterval(typingTimer)
      dialogText.innerHTML = text
      state.typing = false
      if (callback) callback()
      else {
        if (state.dialogIndex < DIALOGS.length) {
          dialogNext.style.display = 'block'
        }
      }
    }
  }, 60)
}

function showNextDialog() {
  if (state.typing) {
    // 跳過打字動畫，直接顯示全文
    clearInterval(typingTimer)
    dialogText.innerHTML = DIALOGS[state.dialogIndex - 1]
    state.typing = false
    dialogNext.style.display = 'block'
    return
  }

  if (state.dialogIndex >= DIALOGS.length) {
    // 對話結束
    dialogBox.classList.remove('visible')
    enterBtn.style.display = 'block'
    return
  }

  var text = DIALOGS[state.dialogIndex]
  state.dialogIndex++
  typeText(text)
}

// 點擊畫面推進對話
document.addEventListener('click', function(e) {
  // 點到按鈕不處理
  if (e.target.id === 'start-btn' || e.target.id === 'enter-btn') return

  if (state.dialogStarted) {
    showNextDialog()
    return
  }

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

// ── 湯川 PNG 立牌（Three.js） ─────────────────────────────────
var yukawaSprite = null
var glowSprite = null
var camera3 = null
var scene3 = null

function setupThreeJS(canvas) {
  // 等 Three.js 載入
  if (typeof THREE === 'undefined') {
    setTimeout(function() { setupThreeJS(canvas) }, 200)
    return
  }

  scene3 = XR8.Threejs.xrScene().scene
  camera3 = XR8.Threejs.xrScene().camera

  // 光暈（發光圓圈在地板）
  var glowGeo = new THREE.CircleGeometry(0.6, 32)
  var glowMat = new THREE.MeshBasicMaterial({
    color: 0xffd764,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  })
  var glow = new THREE.Mesh(glowGeo, glowMat)
  glow.rotation.x = -Math.PI / 2
  glow.visible = false
  scene3.add(glow)

  // 湯川 PNG 立牌
  var loader = new THREE.TextureLoader()
  loader.load(YUKAWA_IMAGE, function(texture) {
    var aspect = texture.image.width / texture.image.height
    var h = 1.7  // 身高約 1.7 公尺
    var w = h * aspect

    var geo = new THREE.PlaneGeometry(w, h)
    var mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    })
    yukawaSprite = new THREE.Mesh(geo, mat)
    yukawaSprite.visible = false

    // 站在地板上（y = 身高一半）
    yukawaSprite.position.y = h / 2
    scene3.add(yukawaSprite)

    // 光暈跟著人物
    glow.position.copy(yukawaSprite.position)
    glow.position.y = 0.01

    glowSprite = glow
  })
}

function placeYukawa() {
  if (!yukawaSprite) return

  // 隨機角度，隨機距離 4-8 公尺
  var angle = Math.random() * Math.PI * 2
  var dist = APPEAR_MIN + Math.random() * (APPEAR_MAX - APPEAR_MIN)

  var x = Math.sin(angle) * dist
  var z = Math.cos(angle) * dist

  state.yukawaPosition = { x: x, z: z }

  yukawaSprite.position.set(x, yukawaSprite.position.y, z)
  yukawaSprite.visible = true

  if (glowSprite) {
    glowSprite.position.set(x, 0.01, z)
    glowSprite.visible = true

    // 光暈閃爍動畫
    var t = 0
    setInterval(function() {
      t += 0.05
      glowSprite.material.opacity = 0.1 + Math.sin(t) * 0.08
    }, 50)
  }

  state.yukawaPlaced = true

  // 顯示找人提示
  scanHint.style.display = 'none'
  foundHint.style.display = 'block'
  setTimeout(function() {
    foundHint.style.opacity = '0'
    foundHint.style.transition = 'opacity 1s'
    setTimeout(function() { foundHint.style.display = 'none' }, 1000)
  }, 4000)
}

function checkProximity() {
  if (!state.yukawaPlaced || state.dialogStarted || !camera3) return
  if (!state.yukawaPosition) return

  var camPos = camera3.position
  var dx = camPos.x - state.yukawaPosition.x
  var dz = camPos.z - state.yukawaPosition.z
  var dist = Math.sqrt(dx * dx + dz * dz)

  // 人物面向使用者
  if (yukawaSprite) {
    yukawaSprite.lookAt(camPos.x, yukawaSprite.position.y, camPos.z)
  }

  // 距離夠近，觸發對話
  if (dist < TRIGGER_DISTANCE) {
    state.dialogStarted = true

    // 震動提示
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])

    // 顯示對話框
    dialogBox.classList.add('visible')
    showNextDialog()
  }
}

// ── Image Target 模組 ─────────────────────────────────────────
function buildImageTargetModule() {
  return {
    name: 'calligraphy-ar',
    listeners: [
      {
        event: 'reality.imagefound',
        process: function(e) {
          if (state.artworkFound) return
          if (e.detail.name !== ARTWORK.name) return
          state.artworkFound = true

          // 震動確認
          if (navigator.vibrate) navigator.vibrate(200)

          // 稍等一下再放置湯川（讓 SLAM 建立空間）
          setTimeout(placeYukawa, 1500)

          // 開始每秒偵測距離
          setInterval(checkProximity, 500)
        },
      },
    ],
  }
}

// ── 8th Wall 初始化 ───────────────────────────────────────────
var targetDataLoaded = []

var fetchPromises = [ARTWORK].map(function(a) {
  return fetch('./image-targets/' + a.name + '/' + a.name + '.json')
    .then(function(r) {
      if (!r.ok) throw new Error('找不到 JSON: ' + a.name)
      return r.json()
    })
})

Promise.all(fetchPromises)
  .then(function(results) { targetDataLoaded = results })
  .catch(function(err) {
    scanHint.innerHTML = '<p style="color:red;">錯誤：' + err.message + '</p>'
  })

function onxrloaded() {
  if (targetDataLoaded.length === 0) { setTimeout(onxrloaded, 200); return }

  XR8.XrController.configure({
    imageTargetData: targetDataLoaded,
    disableWorldTracking: false,  // 需要 SLAM
  })

  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    buildImageTargetModule(),
  ])

  XR8.run({ canvas: document.getElementById('xr-canvas') })
  setupThreeJS(document.getElementById('xr-canvas'))
}

// ── Canvas 尺寸 ───────────────────────────────────────────────
function resizeCanvas() {
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

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(resizeCanvas, 200)
  })

  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)

// 進入故事
enterBtn.addEventListener('click', function() {
  window.location.href = STORY_URL
})
