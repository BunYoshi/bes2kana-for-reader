import * as Types from './types'
import * as Tables from './tables'
import { convertHatsuon } from './convertHatsuon'

  // 外国語引用符内の記号変換
  function convertEnglishSymbol(text: string) {
    const periods = "[\\u2800\\]…'⠴,;:.!-]"
    const questionRegex = new RegExp(`(?<!\\u2800)⠦+(?=${periods}|$)`, "gu")
    return text
      .replace(/⠸⠌/g, '/')
      .replace(/⠈⠯/g, '&')
      .replace(/⠠⠶/g, '[')
      .replace(/⠶⠄/g, ']')
      .replace(/⠄⠄⠄/g, '…')
      .replace(/⠠⠦/g, '\'')
      .replace(/⠴⠄/g, '\'')
      .replace(/⠂/g, ',')
      .replace(/⠆/g, ';')
      .replace(/⠒/g, ':')
      .replace(/⠲/g, '.')
      .replace(/⠖/g, '!')
      .replace(/⠄/g, '\'')
      .replace(/⠤/g, '-')
      .replace(questionRegex, (match) => {
        return '?'.repeat(match.length)
      })
      .replace(/⠦/g, '\"')
      .replace(/⠴/g, '\"')
  }

    // 外国語引用符のペアチェック
  export function getEnglishRangeIndex(text: string): Types.Range[] | false {
    // 下がり数字を除外
    const numberRegex = new RegExp(`⠼(?:${Tables.downNumbers}|[⠄])*(?:${Tables.numbers}+(?:[⠄⠂⠒]${Tables.numbers}+)*)?`, "gu")
    const numberRanges: Types.Range[] = []
    let match: RegExpExecArray | null
    while ((match = numberRegex.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length - 1
      numberRanges.push({ start, end })
    }

    // 外国語引用符の開き・閉じをチェック
    const ranges: Types.Range[] = []
    let depth = 0
    let currentStart = -1
    for (let i = 0; i < text.length; i++) {
      const isInNumberRange = numberRanges.some(r => i >= r.start && i <= r.end)
      if (isInNumberRange) continue // 下がり数字を除外

      const char = text[i]
      if (char === '⠦' && text[i - 1] !== '⠠') {
        if (depth === 0) {
          currentStart = i
          depth++
        } else if (text[i - 1] === '\u2800' || !/[\u2800⠂⠆⠒⠲⠖⠦⠄⠤⠶⠴]/.test(text[i + 1])) {
          depth++
       }
      }
      if (char === '⠴' && text[i + 1] !== '⠄') {
        if (depth === 1) {
          depth--
          ranges.push({ start: currentStart, end: i})
          currentStart = -1
          
        } else if (depth > 1) {
          depth--
        }
      }
    }
    if (depth === 0) {
      return ranges
    } else {
      return false
    }
  }
  
  // 外国語引用符内の処理
  export function convertEnglish(text: string) {
    // Tables.alphabetTable['\u2800'] = ' '
    const ranges = getEnglishRangeIndex(text)
    if (!ranges) return text
    const parts: string[] = []
    let currentIndex = 0
    for (const {start, end} of ranges) {
      if (currentIndex < start) {
        parts.push(text.slice(currentIndex, start))
      }
      const targetText = text.slice(start, end + 1)
      const hatsuonRegex = new RegExp(`⠶⠰([^⠼]*?)⠆⠶`, "gu")
      let content = targetText
        .slice(1, -1)
        .replace(/⠠⠦/g, '\'')
        .replace(/⠴⠄/g, '\'')
        .replace(/⠠⠶/g, '[')
        .replace(/⠶⠄/g, ']')
        .replace(/⠠⠄/g, '⠰')
        .replace(hatsuonRegex, (match, p1) => {
          return convertHatsuon(p1)
        }) // 発音記号符

      let isNumber = false
      let upperType = 0
      let result = ''
      for (const char of content) {
        if (char === '⠠') {
          if (upperType < 2) {
            upperType++
          } else {
            upperType = 1
          }
          isNumber = false
          continue
        } else if (char === '⠰') {
          upperType = 0
          isNumber = false
          continue
        } else if (char === '⠼') {
          upperType = 0
          isNumber = true
          continue
        }
        if (isNumber && new RegExp(Tables.numbers).test(char)) {
          result += Tables.numberTable[char]
        } else if (char === '⠲') {
          result += '.'
        } else if (char === '⠂') {
          result += ','
        } else {
          isNumber = false
          if (new RegExp(Tables.tenjiAlphabets).test(char)) {
            if (upperType > 0) {
              if (upperType === 1) {
                upperType = 0
              }
              result += Tables.alphabetTable[char].toUpperCase()
            } else {
              result += Tables.alphabetTable[char]
            }
          } else {
            upperType = 0
            result += char
          }
        }
      }
      parts.push(convertEnglishSymbol(result))
      currentIndex = end + 1
    }
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex))
    }
    return parts.join('')
  }
