'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Clock, Trophy, AlertTriangle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────
enum GameStatus { START = 'START', PLAYING = 'PLAYING', GAME_OVER = 'GAME_OVER' }
enum OysterType { NORMAL = 'NORMAL', GREEN = 'GREEN' }

interface OysterEntity {
  id: string
  type: OysterType
  x: number
  y: number
  speed: number
  width: number
}

interface GameState {
  status: GameStatus
  score: number
  timeLeft: number
  normalCount: number
  greenCount: number
}

// ── Constants ─────────────────────────────────────────────────────
const ASSETS = {
  BACKGROUND: 'https://i.ibb.co/jkph7Pk6/477d5a3f-446c-4987-ad2c-01843d7f5e65.png',
  OYSTER_NORMAL: 'https://i.ibb.co/rfX3T2JY/Adobe-Express-file-1.png',
  OYSTER_GREEN: 'https://i.ibb.co/mrCCfGH0/Adobe-Express-file.png',
}

const CFG = {
  DURATION: 60,
  SPAWN_RATE_MS: 600,
  GRAVITY_SPEED_MIN: 3,
  GRAVITY_SPEED_MAX: 6,
  BASKET_WIDTH_PERCENT: 18,
  BASKET_HEIGHT_PX: 60,
  OYSTER_WIDTH_PERCENT: 12,
  HIT_BOX_TOLERANCE: 0.8,
  FRENZY_THRESHOLD_SECONDS: 20,
  FRENZY_GREEN_PROBABILITY: 0.8,
  FRENZY_SPEED_MULTIPLIER: 1.5,
  FRENZY_SPAWN_RATE_MS: 150,
}

const SCORING = { [OysterType.NORMAL]: 10, [OysterType.GREEN]: -15 }
const PROBABILITIES = { [OysterType.NORMAL]: 0.6, [OysterType.GREEN]: 0.4 }

// ── Sub-components ────────────────────────────────────────────────
function Basket({ x }: { x: number }) {
  const leftPos = x - CFG.BASKET_WIDTH_PERCENT / 2
  return (
    <div className="absolute bottom-12 pointer-events-none z-20"
      style={{ left: `${leftPos}%`, width: `${CFG.BASKET_WIDTH_PERCENT}%`, height: CFG.BASKET_HEIGHT_PX }}>
      <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-xl">
        <path d="M5 15 L15 55 Q50 65 85 55 L95 15 Z" fill="#8B4513" stroke="#5D2906" strokeWidth="3" />
        <path d="M5 15 Q50 25 95 15" fill="none" stroke="#5D2906" strokeWidth="3" />
        <path d="M15 15 Q50 -20 85 15" fill="none" stroke="#8B4513" strokeWidth="4" />
      </svg>
    </div>
  )
}

function OysterSprite({ entity }: { entity: OysterEntity }) {
  const imgSrc = entity.type === OysterType.NORMAL ? ASSETS.OYSTER_NORMAL : ASSETS.OYSTER_GREEN
  return (
    <div className="absolute top-0 pointer-events-none will-change-transform z-10"
      style={{
        left: `${entity.x}%`,
        width: `${CFG.OYSTER_WIDTH_PERCENT}%`,
        transform: `translateY(${entity.y}px) translateX(-50%)`,
      }}>
      <img src={imgSrc} alt={entity.type} className="w-full h-auto drop-shadow-md"
        style={{ transform: `rotate(${parseInt(entity.id.slice(-2)) % 20 - 10}deg)` }} />
    </div>
  )
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-white text-center">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-yellow-300 drop-shadow-lg tracking-wider">
        採收牡蠣大作戰
      </h1>
      <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-2xl max-w-md w-full backdrop-blur-md mb-8">
        <h2 className="text-xl font-bold mb-4 border-b border-white/30 pb-2">遊戲玩法</h2>
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-4">
            <img src={ASSETS.OYSTER_NORMAL} alt="Normal" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-bold">正常牡蠣</p>
              <p className="text-sm opacity-80">每顆 <span className="text-green-300 font-bold">+{SCORING[OysterType.NORMAL]}</span> 分</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img src={ASSETS.OYSTER_GREEN} alt="Green" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-bold text-red-300">綠牡蠣</p>
              <p className="text-sm opacity-80">每顆 <span className="text-red-400 font-bold">{SCORING[OysterType.GREEN]}</span> 分</p>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm bg-black/20 p-3 rounded-lg space-y-1">
          <p>⏳ 限時 {CFG.DURATION} 秒</p>
          <p>👆 按住螢幕左右滑動控制籃子</p>
        </div>
      </div>
      <button onClick={onStart}
        className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-2xl font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all ring-4 ring-yellow-200/50">
        開始遊戲
      </button>
    </div>
  )
}

function GameOverScreen({ score, normalCount, greenCount, onRestart, onContinue }: {
  score: number; normalCount: number; greenCount: number
  onRestart: () => void; onContinue: (score: number) => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md p-6 text-white text-center">
      <h2 className="text-5xl font-bold mb-4 drop-shadow-lg">時間到！</h2>
      <div className="my-4 bg-white/10 border border-white/20 p-8 rounded-3xl min-w-[280px]">
        <p className="text-xl opacity-80 mb-2">最終得分</p>
        <p className="text-7xl font-bold text-yellow-300 drop-shadow-lg">{score}</p>
      </div>
      <div className="flex gap-6 mb-8">
        <div className="flex flex-col items-center bg-white/10 p-4 rounded-xl border border-white/10">
          <div className="relative">
            <img src={ASSETS.OYSTER_NORMAL} alt="Normal" className="w-12 h-12 mb-2 object-contain" />
            <span className="absolute -top-2 -right-2 bg-green-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">+10</span>
          </div>
          <p className="text-xs opacity-70 mb-1">正常牡蠣</p>
          <p className="font-bold text-xl">× {normalCount}</p>
        </div>
        <div className="flex flex-col items-center bg-white/10 p-4 rounded-xl border border-white/10">
          <div className="relative">
            <img src={ASSETS.OYSTER_GREEN} alt="Green" className="w-12 h-12 mb-2 object-contain" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">-15</span>
          </div>
          <p className="text-xs opacity-70 mb-1">綠牡蠣</p>
          <p className="font-bold text-xl">× {greenCount}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <button onClick={onRestart}
          className="px-6 py-3 bg-white/20 text-white font-semibold rounded-full hover:bg-white/30 transition-colors border border-white/30">
          再玩一次
        </button>
        <button onClick={() => onContinue(score)}
          className="px-8 py-3 bg-yellow-400 text-stone-900 font-bold rounded-full shadow-lg hover:bg-yellow-300 transition-colors">
          繼續故事 →
        </button>
      </div>
    </div>
  )
}

// ── Main Game Component ───────────────────────────────────────────
export default function OysterGame({ onFinish, style }: { onFinish: (score: number) => void; style?: React.CSSProperties }) {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START, score: 0, timeLeft: CFG.DURATION, normalCount: 0, greenCount: 0,
  })

  const oystersRef = useRef<OysterEntity[]>([])
  const [oysters, setOysters] = useState<OysterEntity[]>([])
  const basketXRef = useRef(50)
  const [basketX, setBasketX] = useState(50)
  const lastSpawnRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeLeftRef = useRef(CFG.DURATION)

  function startGame() {
    oystersRef.current = []
    setOysters([])
    basketXRef.current = 50
    setBasketX(50)
    lastSpawnRef.current = performance.now() - CFG.SPAWN_RATE_MS
    timeLeftRef.current = CFG.DURATION
    setGameState({ status: GameStatus.PLAYING, score: 0, timeLeft: CFG.DURATION, normalCount: 0, greenCount: 0 })
  }

  const gameOver = useCallback(() => {
    setGameState(prev => ({ ...prev, status: GameStatus.GAME_OVER }))
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) return
    let rafId: number
    let lastTime = performance.now()

    const loop = (time: number) => {
      const dt = time - lastTime
      lastTime = time

      if (containerRef.current) {
        const { height, width } = containerRef.current.getBoundingClientRect()
        const isFrenzy = timeLeftRef.current <= CFG.FRENZY_THRESHOLD_SECONDS
        const spawnRate = isFrenzy ? CFG.FRENZY_SPAWN_RATE_MS : CFG.SPAWN_RATE_MS

        if (time - lastSpawnRef.current > spawnRate) {
          const greenProb = isFrenzy ? CFG.FRENZY_GREEN_PROBABILITY : PROBABILITIES[OysterType.GREEN]
          const type = Math.random() < greenProb ? OysterType.GREEN : OysterType.NORMAL
          const speedMult = isFrenzy ? CFG.FRENZY_SPEED_MULTIPLIER : 1
          const speed = (Math.random() * (CFG.GRAVITY_SPEED_MAX - CFG.GRAVITY_SPEED_MIN) + CFG.GRAVITY_SPEED_MIN) * speedMult
          oystersRef.current.push({
            id: `${time}-${Math.random()}`, type,
            x: Math.random() * (100 - CFG.OYSTER_WIDTH_PERCENT) + CFG.OYSTER_WIDTH_PERCENT / 2,
            y: -100, speed, width: CFG.OYSTER_WIDTH_PERCENT,
          })
          lastSpawnRef.current = time
        }

        const basketCenter = basketXRef.current
        const basketTopY = height - CFG.BASKET_HEIGHT_PX - 48
        let scoreDelta = 0, normalDelta = 0, greenDelta = 0
        const kept: OysterEntity[] = []

        for (const o of oystersRef.current) {
          o.y += o.speed * (dt / 16)
          const oysterBottom = o.y + width * (o.width / 100)
          let caught = false
          if (oysterBottom >= basketTopY && o.y < height) {
            const bLeft = basketCenter - (CFG.BASKET_WIDTH_PERCENT / 2) * CFG.HIT_BOX_TOLERANCE
            const bRight = basketCenter + (CFG.BASKET_WIDTH_PERCENT / 2) * CFG.HIT_BOX_TOLERANCE
            const oLeft = o.x - (o.width / 2) * CFG.HIT_BOX_TOLERANCE
            const oRight = o.x + (o.width / 2) * CFG.HIT_BOX_TOLERANCE
            if (oRight > bLeft && oLeft < bRight) {
              scoreDelta += SCORING[o.type]
              if (o.type === OysterType.NORMAL) normalDelta++; else greenDelta++
              caught = true
            }
          }
          if (!caught && o.y < height) kept.push(o)
        }

        oystersRef.current = kept
        if (scoreDelta !== 0) {
          setGameState(prev => ({
            ...prev, score: prev.score + scoreDelta,
            normalCount: prev.normalCount + normalDelta,
            greenCount: prev.greenCount + greenDelta,
          }))
        }
        setOysters([...oystersRef.current])
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [gameState.status])

  // Timer
  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) return
    const t = setInterval(() => {
      timeLeftRef.current -= 1
      setGameState(prev => {
        if (prev.timeLeft <= 1) { gameOver(); return { ...prev, timeLeft: 0 } }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [gameState.status, gameOver])

  // Input
  const handleMove = useCallback((clientX: number) => {
    if (gameState.status !== GameStatus.PLAYING || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    basketXRef.current = pct
    setBasketX(pct)
  }, [gameState.status])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState.status !== GameStatus.PLAYING) return
      if (e.key === 'ArrowLeft') { basketXRef.current = Math.max(0, basketXRef.current - 5); setBasketX(basketXRef.current) }
      if (e.key === 'ArrowRight') { basketXRef.current = Math.min(100, basketXRef.current + 5); setBasketX(basketXRef.current) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameState.status])

  const isLowTime = gameState.timeLeft <= CFG.FRENZY_THRESHOLD_SECONDS

  return (
    <div className="relative w-full bg-gray-900 overflow-hidden select-none touch-none" style={{ height: '100dvh', ...style }}>
      <div
        ref={containerRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat overflow-hidden cursor-crosshair"
        style={{ backgroundImage: `url(${ASSETS.BACKGROUND})` }}
        onTouchMove={e => handleMove(e.touches[0].clientX)}
        onMouseMove={e => { if (e.buttons === 1) handleMove(e.clientX) }}
        onMouseDown={e => handleMove(e.clientX)}
      >
        <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />

        {/* HUD */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-30 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-800 tabular-nums">{gameState.score}</span>
          </div>
          <div className={`flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg ${isLowTime ? 'bg-red-50' : ''}`}>
            <Clock className={`w-5 h-5 ${isLowTime ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
            <span className={`text-2xl font-bold tabular-nums ${isLowTime ? 'text-red-600' : 'text-gray-800'}`}>{gameState.timeLeft}s</span>
          </div>
        </div>

        {/* Frenzy overlay */}
        {isLowTime && gameState.status === GameStatus.PLAYING && (
          <>
            <div className="absolute inset-0 bg-red-500/10 pointer-events-none z-10 animate-pulse" />
            <div className="absolute top-24 left-0 right-0 z-40 flex justify-center pointer-events-none">
              <div className="bg-red-600/90 text-white px-8 py-3 rounded-xl border-4 border-yellow-400 shadow-xl animate-bounce">
                <p className="text-xl font-black tracking-widest flex items-center gap-2 text-yellow-300">
                  <AlertTriangle className="w-6 h-6 fill-yellow-300 text-red-600" />
                  工業污染增加
                  <AlertTriangle className="w-6 h-6 fill-yellow-300 text-red-600" />
                </p>
                <p className="text-center mt-1 text-white text-lg font-bold">綠牡蠣大量出現！</p>
              </div>
            </div>
          </>
        )}

        {oysters.map(o => <OysterSprite key={o.id} entity={o} />)}
        <Basket x={basketX} />

        {gameState.status === GameStatus.START && <StartScreen onStart={startGame} />}
        {gameState.status === GameStatus.GAME_OVER && (
          <GameOverScreen
            score={gameState.score}
            normalCount={gameState.normalCount}
            greenCount={gameState.greenCount}
            onRestart={startGame}
            onContinue={onFinish}
          />
        )}
        {gameState.status === GameStatus.PLAYING && !isLowTime && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center opacity-25 pointer-events-none animate-pulse">
            <div className="flex gap-20 text-white text-2xl">
              <ArrowLeft className="w-8 h-8" />
              <ArrowRight className="w-8 h-8" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
