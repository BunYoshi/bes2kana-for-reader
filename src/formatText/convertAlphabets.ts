import * as Tables from './tables'
import { convertHatsuon } from './convertHatsuon'

  // 外字符の処理
  export function convertAlphabets(text: string) {
    Tables.alphabetTable['⠌'] = '/'
    Tables.alphabetTable['⠲'] = '.'
    const endMarks = "\\u2800|⠠⠤|⠤|⠶|⠰⠄|⠠⠆|⠰⠤|⠐⠶|⠰⠶|⠐⠤|⠼"
    const alphabetRegex = new RegExp(`⠰((?!(${endMarks}|${Tables.nonBraille})).)+`, "gu")
    const hirakiRegex = new RegExp(`^(⠰⠄|⠰⠤|⠰⠆)+`, "gu")
    const hatsuonRegex = new RegExp(`⠰([^⠼]*?)⠆`, "gu")
    return text.replace(alphabetRegex, (match) => {
      let hiraki = ''
      let content = match.replace(hirakiRegex, (m) => {
        hiraki = m
        return ''
      })
      if (content[0] !== '⠰') return match
      if (hatsuonRegex.test(content)) {
        content = content
          .replace(hatsuonRegex, (match, p1) => {
            return convertHatsuon(p1)
          }) // 発音記号符
      } else {
        content = content.slice(1)
      }
      let upperType = 0
      let result = ''
      if (Tables.markTable[content[0]]) {
        return hiraki + Tables.markTable[content[0]] + content.slice(1)
      }
      for (const char of content) {
        if (char === '⠠') {
          upperType++
          continue
        } else if (char === '⠰') {
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
          result += Tables.alphabetTable[char] !== undefined ? Tables.alphabetTable[char] : char
        }
      }
      return hiraki + result
    })
  }
