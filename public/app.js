// ── 設定 ──────────────────────────────────────────────────────
var ARTWORK_NAME = 'artwork-01'
var STORY_URL = 'https://calligraphy-ar.vercel.app/'
var YUKAWA_IMAGE = './yukawa.png'

var DIALOGS = [
  '……你來了。我在這裡等了很久。',
  '這幅字，是我晚年寫下的。世界是一體的——不論是原子，還是人心。',
  '當年我們劈開了原子，卻沒能劈開人與人之間的隔閡。',
  '現在，這個選擇交給你了。你願意繼續往下看嗎？',
]

// ── 狀態 ──────────────────────────────────────────────────────
var state = {
  artworkFound: false,
  yukawaVisible: false,
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
})

// ── 掃描倒數 UI ───────────────────────────────────────────────
function showScanCountdown(onDone) {
  // 掃描提示
  foundHint.style.display = 'block'
  foundHint.style.opacity = '1'
  foundHint.style.transition = ''
  foundHint.querySelector('p').textContent = '請將手機環繞展場緩慢掃描...'

  // 建立倒數元素
  var cdEl = document.createElement('div')
  cdEl.id = 'scan-countdown'
  cdEl.style.cssText = [
    'position:fixed',
    'top:50%', 'left:50%',
    'transform:translate(-50%,-50%)',
    'z-index:300',
    'text-align:center',
    'pointer-events:none',
    'font-family:sans-serif',
  ].join(';')

  var numEl = document.createElement('div')
  numEl.style.cssText = [
    'font-size:80px',
    'font-weight:700',
    'color:#ffd764',
    'line-height:1',
    'text-shadow:0 0 30px rgba(255,215,100,0.8)',
    'animation:countPop 0.3s ease',
  ].join(';')

  var labelEl = document.createElement('div')
  labelEl.style.cssText = [
    'font-size:13px',
    'color:rgba(255,255,255,0.6)',
    'margin-top:8px',
    'letter-spacing:0.15em',
  ].join(';')
  labelEl.textContent = '掃描中'

  cdEl.appendChild(numEl)
  cdEl.appendChild(labelEl)
  document.body.appendChild(cdEl)

  // 加倒數動畫 CSS
  var style = document.createElement('style')
  style.innerHTML = '@keyframes countPop{from{transform:scale(1.4);opacity:0.3}to{transform:scale(1);opacity:1}}'
  document.head.appendChild(style)

  var count = 5
  numEl.textContent = count

  var timer = setInterval(function() {
    count--
    if (count <= 0) {
      clearInterval(timer)
      cdEl.remove()
      foundHint.style.transition = 'opacity 0.5s'
      foundHint.style.opacity = '0'
      setTimeout(function() {
        foundHint.style.display = 'none'
        onDone()
      }, 500)
    } else {
      numEl.style.animation = 'none'
      void numEl.offsetWidth // reflow
      numEl.style.animation = 'countPop 0.3s ease'
      numEl.textContent = count
    }
  }, 1000)
}

// ── 湯川 HTML 元素 ────────────────────────────────────────────
var yukawaEl = null
var glowEl = null
var yukawaContainer = null
var deviceAlpha = 0
var baseAlpha = null
var yukawaDirection = 0

// alpha 平滑
var smoothAlpha = 0
var prevAlpha = 0

function setupDeviceOrientation() {
  window.addEventListener('deviceorientation', function(e) {
    var raw = e.alpha || 0

    // 處理 360/0 跨越
    var diff = raw - prevAlpha
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    smoothAlpha += diff * 0.15  // 低通濾波，減少飄動
    prevAlpha = raw
    deviceAlpha = smoothAlpha
  })
}

function createYukawaHTML() {
  var container = document.createElement('div')
  container.id = 'yukawa-container'
  container.style.cssText = [
    'position:fixed',
    'top:0', 'left:0', 'width:100%', 'height:100%',
    'z-index:50',
    'pointer-events:none',
    'display:none',
    'overflow:hidden',
  ].join(';')

  glowEl = document.createElement('div')
  glowEl.style.cssText = [
    'position:absolute',
    'bottom:14%', 'left:50%',
    'transform:translateX(-50%)',
    'width:130px', 'height:35px',
    'background:radial-gradient(ellipse, rgba(255,215,100,0.45) 0%, transparent 70%)',
    'border-radius:50%',
    'transition:left 0.3s ease',
  ].join(';')

  yukawaEl = document.createElement('img')
  yukawaEl.src = YUKAWA_IMAGE
  yukawaEl.style.cssText = [
    'position:absolute',
    'bottom:14%', 'left:50%',
    'transform:translateX(-50%)',
    'height:58vh',
    'width:auto',
    'object-fit:contain',
    'filter:drop-shadow(0 0 24px rgba(255,215,100,0.35))',
    'transition:left 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
  ].join(';')

  yukawaEl.onerror = function() {
    yukawaEl.style.display = 'none'
    var box = document.createElement('div')
    box.id = 'yukawa-box'
    box.style.cssText = [
      'position:absolute',
      'bottom:14%', 'left:50%',
      'transform:translateX(-50%)',
      'width:80px', 'height:160px',
      'background:#ff3300',
      'transition:left 0.3s ease',
    ].join(';')
    container.appendChild(box)
    yukawaEl = box
  }

  container.appendChild(glowEl)
  container.appendChild(yukawaEl)
  document.body.appendChild(container)

  // 浮動動畫
  var style = document.createElement('style')
  style.innerHTML = [
    '@keyframes yukawaAppear{',
    '  from{opacity:0;transform:translateX(-50%) translateY(30px) scale(0.85)}',
    '  to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}',
    '}',
    '@keyframes glowAnim{',
    '  0%,100%{opacity:0.5;transform:translateX(-50%) scaleX(1)}',
    '  50%{opacity:1;transform:translateX(-50%) scaleX(1.25)}',
    '}',
  ].join('')
  document.head.appendChild(style)

  return container
}

function placeYukawa() {
  baseAlpha = smoothAlpha
  var offset = (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 50)
  yukawaDirection = offset

  yukawaContainer.style.display = 'block'
  yukawaEl.style.animation = 'yukawaAppear 0.8s ease forwards'
  glowEl.style.animation = 'glowAnim 2.5s ease-in-out infinite'

  state.yukawaVisible = true

  // 顯示找人提示
  foundHint.querySelector('p').textContent = '湯川秀樹就在展場某處，試著找到他'
  foundHint.style.display = 'block'
  foundHint.style.opacity = '1'
  foundHint.style.transition = ''
  setTimeout(function() {
    foundHint.style.transition = 'opacity 1s'
    foundHint.style.opacity = '0'
    setTimeout(function() { foundHint.style.display = 'none' }, 1000)
  }, 3500)

  startPositionUpdate()
}

function startPositionUpdate() {
  var triggered = false

  setInterval(function() {
    if (!state.yukawaVisible || baseAlpha === null) return

    var diff = smoothAlpha - baseAlpha - yukawaDirection
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360

    var screenX = 50 - diff * 0.75
    screenX = Math.max(5, Math.min(95, screenX))

    var absDiff = Math.abs(diff)
    var scale = Math.max(0.5, 1 - absDiff / 180)
    var opacity = Math.max(0.15, 1 - absDiff / 110)

    var transform = 'translateX(-50%) scale(' + scale + ')'

    if (yukawaEl) {
      yukawaEl.style.left = screenX + '%'
      yukawaEl.style.transform = transform
      yukawaEl.style.opacity = opacity
    }
    if (glowEl) {
      glowEl.style.left = screenX + '%'
      glowEl.style.opacity = opacity * 0.7
    }

    // 夠近觸發對話
    if (!triggered && absDiff < 18 && state.yukawaVisible) {
      triggered = true
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])

      // 湯川停在中間
      if (yukawaEl) {
        yukawaEl.style.left = '50%'
        yukawaEl.style.transform = 'translateX(-50%) scale(1)'
        yukawaEl.style.opacity = '1'
      }
      if (glowEl) {
        glowEl.style.left = '50%'
        glowEl.style.opacity = '0.8'
      }

      setTimeout(function() {
        dialogBox.classList.add('visible')
        state.dialogStarted = true
        showNextDialog()
      }, 600)
    }
  }, 50)
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

          // 先倒數掃描，再出現湯川
          showScanCountdown(function() {
            placeYukawa()
          })
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
    disableWorldTracking: true,
  })
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.XrController.pipelineModule(),
    buildImageTargetModule(),
  ])
  XR8.run({ canvas: document.getElementById('xr-canvas') })
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
  yukawaContainer = createYukawaHTML()
  setupDeviceOrientation()
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(resizeCanvas, 200)
  })
  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
enterBtn.addEventListener('click', function() { window.location.href = STORY_URL })
