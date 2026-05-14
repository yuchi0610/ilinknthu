export type SceneType = 'animation' | 'newspaper' | 'dialog' | 'text' | 'signature' | 'game' | 'ending'

export interface Scene {
  id: string
  type: SceneType
  title: string
  order: number
  config: SceneConfig
  visible: boolean
  created_at: string
  updated_at: string
}

export interface AnimationConfig {
  video_url: string
  autoplay: boolean
  loop: boolean
  auto_advance: boolean
}

export interface NewspaperPage {
  image_url: string
}

export interface NewspaperConfig {
  pages: NewspaperPage[]
}

export interface DialogLine {
  speaker: string
  text: string
  character_image_url?: string
  character_x?: number     // 0–100, horizontal center position, default 50
  character_scale?: number // 50–200, percentage of area height, default 100
}

export interface DialogConfig {
  background_url?: string
  dialogs: DialogLine[]
  box_theme?: 'dark' | 'light'
  box_height?: number      // vh units, default 38
  name_font_size?: number  // px, default 14
  name_color?: string
  text_font_size?: number  // px, default 14
  text_color?: string
}

export interface TextConfig {
  text: string
  background_url?: string
  overlay_opacity?: number
  font_size?: number   // px, default 16
  text_color?: string  // default #ffffff
}

export interface SignatureConfig {
  document_url: string
  instruction: string
  background_url?: string
  signature_area: { x: number; y: number; width: number; height: number }
}

export interface GameConfig {
  game_id: string
  title: string
  description: string
  max_score: number
  time_limit: number
}

export type SceneConfig =
  | AnimationConfig
  | NewspaperConfig
  | DialogConfig
  | TextConfig
  | SignatureConfig
  | GameConfig
  | Record<string, unknown>

export interface Ending {
  id: string
  type: 'A' | 'B' | 'C'
  label: string
  score_min: number
  score_max: number
  config: {
    video_url?: string
    description?: string
    image_url?: string
  }
}

export interface Session {
  id: string
  started_at: string
  ended_at?: string
  scores: Record<string, number>
  total_score: number
  ending_type?: string
  user_agent?: string
  signature_url?: string
}
