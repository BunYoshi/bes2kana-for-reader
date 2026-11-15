import * as Tables from './tables'


export function convertKana(text: string): string {

  const endSymbols = "[\\u2800|\\u2816|⠤|？|@|…|=|：|】|”|’|＞|』|｝|\\)|\\||※|☆|、|。|・|⠢|│]"
  function createRegex(prefix: string) {
    return new RegExp(`${prefix}(?=${endSymbols}|$)`, "gu")
  }
  const shijifu1Regex = new RegExp(`⠐⠤(.*?)⠤⠂`, "gu")
  const shijifu2Regex = new RegExp(`⠐⠤⠤(.*?)⠤⠤⠂`, "gu")
  const shijifu3Regex = new RegExp(`⠰⠤⠤(.*?)⠤⠤⠆`, "gu")

  const convertedSymbols = text
    .replace(/\u2800\u2800⠔⠔\u2800/g, '\u2800\u2800☆\u2800')
    .replace(/\u2800\u2800⠢⠢\u2800/g, '\u2800\u2800☆☆\u2800')
    .replace(/⠸⠸\u2800\u2800/g, '\/\/＿')
    .replace(/⠸\u2800\u2800/g, '\/＿')
    .replace(/⠪⠒⠒⠕/g, '⇔')
    .replace(/⠒⠒⠕/g, '→')
    .replace(/⠪⠒⠒/g, '←')
    .replace(/⠂⠂⠂/g, '……')
    .replace(shijifu3Regex, '【$1】')
    .replace(shijifu2Regex, '“$1”')
    .replace(shijifu1Regex, '‘$1’')
    .replace(/⠰⠄/g, '＜')
    .replace(/⠠⠆/g, '＞')
    .replace(/⠰⠤/g, '『')
    .replace(/⠤⠆/g, '』')
    .replace(/⠐⠶(.*?)⠶⠂/gu, '（$1）')
    .replace(/⠐⠶(.*?)⠶⠂/gu, '（$1）')
    .replace(/⠐⠶(.*?)⠶⠂/gu, '（$1）') // 複層対応
    .replace(/⠰⠶/g, '(')
    .replace(/⠶⠆/g, ')')
    .replace(/⠠⠄/g, '=')
    .replace(/⠠⠤/g, '…')
    .replace(/⠐⠂/g, '：')
    .replace(/⠰⠆/g, '[※]…')
    .replace(/⠐⠵/g, '○')
    .replace(/⠐⠷/g, '△')
    .replace(/⠐⠽/g, '□')
    .replace(/⠐⠿/g, '×')
    .replace(/⠐⠾/g, '◇')
    .replace(/⠰([0-9]+)⠆/gu, '[※$1]…') // 数字入り文中注記符後に「…」を挿入
    .replace(/⠰/g, '、')
    .replace(/⠤⠤/g, '～')
    .replace(/⠶/g, '…')
    .replace(createRegex('⠲'), '。')
    .replace(createRegex('⠠⠢'), '[☆☆☆]…')
    .replace(createRegex('⠢'), '？')
    .replace(/⠐\u2800/g, '・\u2800')
    .replace(createRegex('⠖'), '！')
    .replace(/⠤/g, '…')
    .replace(/⠒⠒/g, '─')
  
  let result = ''
  for (const char of convertedSymbols) {
    const baseChar = Tables.table50[char]
    if (baseChar) {
      result += baseChar
    } else {
      result += char
    }
  }

  function toDakuon(char: string): string {
    if (Tables.dakutenExceptions[char]) {
      return Tables.dakutenExceptions[char]
    }
    return String.fromCharCode(char.charCodeAt(0) + 1)
  }
  function toYouon(char: string): string {
    return Tables.youonTable[char] ?? char
  }

  const prefixRegex = /([⠈|⠐|⠠|⠘|⠨|⠸|⠢|⠲])(.)/g
  result = result.replace(prefixRegex, (match, prefix, baseChar) => {
    switch (prefix) {
      case '⠈':
        return Tables.youonTable[baseChar] ?? match
      case '⠐':
        return toDakuon(baseChar) ?? match
      case '⠠':
        return String.fromCharCode(baseChar.charCodeAt(0) + 2) ?? match
      case '⠘':
        return Tables.youon45Table[baseChar] ?? toDakuon(toYouon(baseChar)[0]) + toYouon(baseChar)[1]
      case '⠨':
        return Tables.youon46Table[baseChar] ?? match
      case '⠸':
        return Tables.youon456Table[baseChar] ?? match
      case '⠢':
        return Tables.youon26Table[baseChar] ?? match
      case '⠲':
        const str = Tables.youon26Table[baseChar] ?? match
        return str
          .replace(/く/, 'ぐ')
          .replace(/と/, 'ど')
          .replace(/ふ/, 'ゔ')
      default:
        return match
    }
  })

  return result.replace(/\u2800/g, '　')
}