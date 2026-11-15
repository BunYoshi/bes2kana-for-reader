export type OutputMode = 'hiragana' | 'katakana'
export interface EngineOptions {
  mode: OutputMode
}

export type ViewMode = 'text' | 'html'

export interface Range {
    start: number
    end: number
  }

export  interface MatchInfo {
    index: number
    length: number
  }

export type Score = -2 | 0 | 2 | undefined