import { match } from 'assert'
import * as Tables from './tables'

  // 数字の変換
  export function convertNumbers(text: string) {
    const numberNumberRegex = new RegExp(`(⠼${Tables.numbers}+)(⠼${Tables.numbers}+)`, "gu")
    const numberSpaceNumberRegex = new RegExp(`(⠼${Tables.numbers}+)(\\u2800⠼${Tables.numbers}+)+`, "gu")
    const numberRegex = new RegExp(`⠼(?:${Tables.downNumbers}|[⠄])*(?:${Tables.numbers}+(?:[⠄⠂⠒]${Tables.numbers}+)*)?`, "gu")
    const downNumberRegex = new RegExp(`^${Tables.downNumbers}+`, "gu")
    const downNumPlusNumRegex = new RegExp(`^(${Tables.downNumbers}+)(${Tables.numbers}+)`, "gu")
    Tables.numberTable['⠂'] = '.'
    Tables.numberTable['⠒'] = ':'

    const str = text
      .replace(numberNumberRegex, "$1、　$2")
      .replace(numberSpaceNumberRegex, (match) => {
        return match.replace(/\u2800/g, "、　")
      })
      .replace(/(?<!⠤)⠤⠼/g, "⠎\u2800⠼")
    return str.replace(numberRegex, (match) => {
      const content = match.slice(1)
      // 下がり数字を数字に変換
      const kansuji = content
        .replace(downNumPlusNumRegex, '$1、　$2')
        .replace(downNumberRegex, (match) => {
          let result = ''
          for (const char of match) {
            result += Tables.downNumToNumTable[char]
          }
          return result
        })
      
      // 残る数字と記号を変換
      let result = "";
      for (let i = 0; i < kansuji.length; i++) {
        let char = kansuji[i];
        if (char === '⠄') { // 3の点の場合
          if (i === 0) {
            result += "'" // 数符直後ならアポストロフィー
          } else if (kansuji.length - i > 3) {
            result += "," // 途中なら位取り点
          } else {
            result += kansuji.slice(i)
            return result
          }
        } else {
          result += Tables.numberTable[char] !== undefined ? Tables.numberTable[char] : char
        }
      }
      return result;
    });
  }
