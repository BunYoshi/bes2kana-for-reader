import * as Types from './types'
import * as Tables from './tables'

// アドレス囲み符号内の記号変換
  function convertAddressSymbol(text: string) {
    return text
      .replace(/\u2810\u2802/g, ':')
      .replace(/\u2810\u2826/g, '?')
      .replace(/\u2810\u2811/g, '`')
      .replace(/\u2810\u2824/g, '_')
      .replace(/\u2810\u2809/g, '~')
      .replace(/\u2812\u2812/g, '=')
      .replace(/\u2814\u2814/g, '<')
      .replace(/\u2822\u2822/g, '>')
      .replace(/\u2802/g, ',')
      .replace(/\u2832/g, '.')
      .replace(/\u2806/g, ';')
      .replace(/\u2816/g, '!')
      .replace(/\u282a/g, '@')
      .replace(/\u2829/g, '#')
      .replace(/\u282b/g, '\\')
      .replace(/\u2839/g, '$')
      .replace(/\u283b/g, '%')
      .replace(/\u282f/g, '&')
      .replace(/\u2821/g, '*')
      .replace(/\u2833/g, '|')
      .replace(/\u282c/g, '+')
      .replace(/\u2824/g, '-')
      .replace(/\u280c/g, '/')
      .replace(/\u2836/g, '\"')
      .replace(/\u2804/g, '\'')
      .replace(/\u2818/g, '^')
      .replace(/\u2826/g, '(')
      .replace(/\u2834/g, ')')
      .replace(/\u2823/g, '{')
      .replace(/\u281c/g, '}')
      .replace(/\u2837/g, '[')
      .replace(/\u283e/g, ']')
  }

  // アドレス囲み符号の位置を後ろから取得
  function getAddressRange(text: string): Types.MatchInfo[] {
    const matchDetails: Types.MatchInfo[] = []
    const addressRegex = new RegExp(`⠴⠠(.*?)⠦⠠`, "gu")
    const rev = text.split('').reverse().join('')
    for (const match of rev.matchAll(addressRegex)) {
      if (match.index !== undefined) {
        const matchLen = [...match[0]].length
        const originalIndex = text.length - match.index - matchLen
        matchDetails.push({
          index: originalIndex,
          length: matchLen
        })
      }
    }
    return matchDetails.sort((a, b) => a.index - b.index)
  }
  // アドレス囲み符号内の処理
  export function convertAddress(text: string) {
    // const addressRegex = new RegExp(`⠠⠦(.*?)⠠⠴`, "gu")
    const numberRegex = new RegExp(`⠼(${Tables.numbers}|⠲)+`, "gu")
    const nonBrailleRegex = new RegExp(`${Tables.nonBraille}*\\u2800*⠈`, "gu")
    // Tables.alphabetTable['\u2800'] = ' '

    let result = ''
    let currentIndex = 0
    const addressRanges = getAddressRange(text)
    for (const match of addressRanges) {
      if (match.index > currentIndex) {
        const normalText = text.slice(currentIndex, match.index)
        result += normalText
      }
      const matchedText = text
        .slice(match.index, match.index + match.length)
        .slice(2, -2)
        .replace(/\u2800?⠈/gu, '')
        // .replace(nonBrailleRegex, '')
        
      let upperType = 0
      const parts = matchedText.split(/(⠸⠦.+?⠸⠴)/gu)
      parts.map((part) => {
        if (part.startsWith("⠸⠦") && part.endsWith("⠸⠴")) {
          result += part.slice(2, -2)
        } else {
          let processedNumbers = part.replace(numberRegex, (match) => {
            let result = ''
            for (const char of match) {
              result += Tables.numberTable[char] ?? char
            }
            return result
          })
          let processedAddressSymbol = convertAddressSymbol(processedNumbers)
          for (const char of processedAddressSymbol) {
            if (char === '⠠') {
              upperType++
              continue
            } else if (char === '⠰') {
              upperType = 0
              continue
            } else if (char === '⠼') {
              upperType = 0
              continue
            }
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
      })
      // result += matchedText
      currentIndex = match.index + match.length
    }
    if (currentIndex < text.length) {
      result += text.slice(currentIndex)
    }

    return result
  }
