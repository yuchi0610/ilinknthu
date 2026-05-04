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

// 圖像錨點（從 imagefound / imageupdated 更新）
var artworkAnchor = { pos: null, rot: null, updatedAt: 0 }

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

// ── Three.js（共用 GLctx 方式） ───────────────────────────────
var scene3 = null
var yukawaMesh = null
var glowMesh = null
var yukawaPos = { x: 0, z: 0 }

function threePipelineModule() {
  return {
    name: 'custom-three',

    onStart: function(args) {
      var canvas = args.canvas
      var GLctx = args.GLctx
      var canvasWidth = args.canvasWidth
      var canvasHeight = args.canvasHeight

      var scene = new THREE.Scene()
      var camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.01, 1000)
      scene.add(camera)
      scene.add(new THREE.AmbientLight(0xffffff, 2.5))

      var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: GLctx,
        alpha: false,
        antialias: true,
      })
      renderer.autoClear = false
      renderer.setSize(canvasWidth, canvasHeight)

      scene3 = { scene: scene, camera: camera, renderer: renderer }

      camera.position.set(0, 3, 0)
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })

      loadYukawa(scene)
    },

    onUpdate: function(args) {
      if (!args.processCpuResult || !args.processCpuResult.reality) return
      var reality = args.processCpuResult.reality
      var camera = scene3.camera

      // 更新投影矩陣
      if (reality.intrinsics) {
        for (var i = 0; i < 16; i++) {
          camera.projectionMatrix.elements[i] = reality.intrinsics[i]
        }
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
      }

      // 更新相機旋轉和位置
      if (reality.rotation) {
        camera.setRotationFromQuaternion(reality.rotation)
      }
      if (reality.position) {
        camera.position.set(reality.position.x, reality.position.y, reality.position.z)
      }

      // 光暈動畫
      if (glowMesh && glowMesh.visible) {
        glowMesh.material.opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.08
      }

      // 錨點更新：將人物 lerp 到展品旁固定偏移（錨點最近 500ms 內有效）
      if (state.yukawaPlaced && artworkAnchor.pos && (Date.now() - artworkAnchor.updatedAt) < 500) {
        var targetPos = computeYukawaTarget()
        if (targetPos) {
          yukawaMesh.position.lerp(targetPos, 0.05)
          if (glowMesh) {
            glowMesh.position.set(
              yukawaMesh.position.x,
              yukawaMesh.position.y - 0.9,
              yukawaMesh.position.z
            )
          }
          yukawaPos.x = yukawaMesh.position.x
          yukawaPos.z = yukawaMesh.position.z
        }
      }

      // 人物面向相機（lerp + 3° 死區）
      if (yukawaMesh && yukawaMesh.visible) {
        var dx = camera.position.x - yukawaMesh.position.x
        var dz = camera.position.z - yukawaMesh.position.z
        var targetAngle = Math.atan2(dx, dz)
        var cur = yukawaMesh.rotation.y
        var delta = targetAngle - cur
        while (delta > Math.PI) delta -= 2 * Math.PI
        while (delta < -Math.PI) delta += 2 * Math.PI
        if (Math.abs(delta) > 0.05) {
          yukawaMesh.rotation.set(0, cur + delta * 0.05, 0)
        }
      }

      // 靠近偵測
      if (state.yukawaPlaced && !state.dialogStarted && reality.position) {
        var ddx = reality.position.x - yukawaPos.x
        var ddz = reality.position.z - yukawaPos.z
        var dist = Math.sqrt(ddx * ddx + ddz * ddz)
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

    onRender: function() {
      if (!scene3) return
      scene3.renderer.clearDepth()
      scene3.renderer.render(scene3.scene, scene3.camera)
    },

    onCanvasSizeChange: function(args) {
      if (!scene3) return
      scene3.renderer.setSize(args.canvasWidth, args.canvasHeight)
      scene3.camera.aspect = args.canvasWidth / args.canvasHeight
      scene3.camera.updateProjectionMatrix()
    },
  }
}

// ── 從錨點計算湯川目標位置 ────────────────────────────────────
function computeYukawaTarget() {
  var p = artworkAnchor.pos
  var q = artworkAnchor.rot
  if (!p || !q) return null

  // 展品法線（牆面朝外方向）
  var normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
    new THREE.Quaternion(q.x, q.y, q.z, q.w)
  )
  normal.y = 0
  if (normal.length() < 0.01) normal.set(0, 0, 1)
  normal.normalize()

  // 人物中心：展品前方 1.5m，Y 軸：展品 Y - 0.5
  // （展品掛牆約 1.4m 高，人物中心 ≈ 地面 + 0.9m，故 artwork.y - 0.5）
  return new THREE.Vector3(
    p.x + normal.x * 1.5,
    p.y - 0.5,
    p.z + normal.z * 1.5
  )
}

// ── 驗證並提取錨點資料 ────────────────────────────────────────
function extractAnchor(detail) {
  var p = detail.position
  var r = detail.rotation
  if (!p || !r) return false
  if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z)) return false
  if (!isFinite(r.x) || !isFinite(r.y) || !isFinite(r.z) || !isFinite(r.w)) return false
  artworkAnchor.pos = { x: p.x, y: p.y, z: p.z }
  artworkAnchor.rot = { x: r.x, y: r.y, z: r.z, w: r.w }
  artworkAnchor.updatedAt = Date.now()
  return true
}

function loadYukawa(scene) {
  var geo = new THREE.BoxGeometry(0.7, 2.2, 0.05)
  var mat = new THREE.MeshBasicMaterial({ color: 0xff3300 })
  yukawaMesh = new THREE.Mesh(geo, mat)
  yukawaMesh.visible = false
  scene.add(yukawaMesh)

  var gGeo = new THREE.CircleGeometry(0.6, 32)
  var gMat = new THREE.MeshBasicMaterial({
    color: 0xffd764, transparent: true,
    opacity: 0.2, side: THREE.DoubleSide, depthWrite: false,
  })
  glowMesh = new THREE.Mesh(gGeo, gMat)
  glowMesh.rotation.x = -Math.PI / 2
  glowMesh.visible = false
  scene.add(glowMesh)

  var loader = new THREE.TextureLoader()
  loader.load(YUKAWA_IMAGE, function(tex) {
    var aspect = tex.image.width / tex.image.height
    var h = 2.2
    var pGeo = new THREE.PlaneGeometry(h * aspect, h)
    var pMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true,
      side: THREE.DoubleSide, depthWrite: false,
    })
    var newMesh = new THREE.Mesh(pGeo, pMat)
    newMesh.visible = yukawaMesh.visible
    newMesh.position.copy(yukawaMesh.position)
    newMesh.rotation.copy(yukawaMesh.rotation)
    scene.remove(yukawaMesh)
    yukawaMesh = newMesh
    scene.add(yukawaMesh)
  }, undefined, function() {
    console.log('PNG 載入失敗，使用紅色方塊')
  })
}

function placeYukawa() {
  if (!yukawaMesh) { setTimeout(placeYukawa, 300); return }

  var target = computeYukawaTarget()
  if (!target) { setTimeout(placeYukawa, 300); return }

  yukawaMesh.position.copy(target)
  yukawaMesh.visible = true

  yukawaPos.x = target.x
  yukawaPos.z = target.z

  if (glowMesh) {
    glowMesh.position.set(target.x, target.y - 0.9, target.z)
    glowMesh.visible = true
  }

  state.yukawaPlaced = true

  foundHint.querySelector('p').textContent = '湯川秀樹出現了，試著走近他'
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
          if (e.detail.name !== ARTWORK_NAME) return
          if (!extractAnchor(e.detail)) return
          if (state.artworkFound) return
          state.artworkFound = true
          if (navigator.vibrate) navigator.vibrate(200)
          scanHint.style.display = 'none'
          placeYukawa()
        },
      },
      {
        event: 'reality.imageupdated',
        process: function(e) {
          if (e.detail.name !== ARTWORK_NAME) return
          extractAnchor(e.detail)
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
    XR8.XrController.pipelineModule(),
    XR8.GlTextureRenderer.pipelineModule(),
    threePipelineModule(),
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
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  screen.orientation && screen.orientation.addEventListener('change', function() {
    setTimeout(resizeCanvas, 200)
  })
  window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
}

document.getElementById('start-btn').addEventListener('click', startAR)
enterBtn.addEventListener('click', function() { window.location.href = STORY_URL })
