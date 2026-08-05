export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface OcrResult {
  text: string
  confidence: number
}

export type SnipSource = 'clipboard' | 'file' | 'drop' | 'screen'
