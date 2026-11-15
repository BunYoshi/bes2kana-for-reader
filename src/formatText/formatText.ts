import type { OutputMode } from "./types"
import { unicode2kana } from "./unicode2kana"
import { Score } from "./types"
import { getEnglishRangeIndex } from "./convertEnglish"
import { wakuTable } from "./tables"
import * as Tables from './tables'
import { resolveModuleName } from "typescript"

export function formatText(unicode: string, mode: OutputMode): string {
  if (!unicode) return ''

  // ユニコードの整理
  const normalizedText = unicode
    .replace(/@LB@.@PB@/gu, '@LB@@PB@') // 改ページ記号を整理
    .replace(/@LB@@HR@@LB@@LB@/g, '@LB@') // 見出しタグを削除

  // ----------------------------------------------------
  // 表紙・目次ページの終わりを判定
  // ----------------------------------------------------
  let startIndex = 0

  // 判定条件1: 先頭行が28マス目の数符⠼（\u283c）から始まっているか
  const startsWith28Num = /^\u2800{25,}\u283c/.test(normalizedText)

  if (!startsWith28Num) {
    // 判定条件2: 「@PB@ → スペース複数 → 数符⠼（\u283c）」の並びが現れる最初の位置を探す
    const match = normalizedText.match(/@PB@\u2800+\u283c/)
    if (match && match.index !== undefined) {
      startIndex = match.index
    }
  }

  // ----------------------------------------------------
  // 前半（表紙・目次ページ）と後半（それ以降）に分割
  // ----------------------------------------------------
  const result: string[] = []

  // 前半部分（startIndexより前）をそのままpush
  const beforeText = normalizedText.slice(0, startIndex)
  let pageFrameCount = 0
  let titleFrameCount = 0
  let indexOfTitleLine = 0
  let isFirstPage = true
  let isTocPage = false
  let isStart = true
  let isEnd = true
  let mostFrequentIndex: number | null = null

  // ----------------------------------------------------
  // 前半（表紙・目次ページ）の処理
  // ----------------------------------------------------
  if (beforeText) {
    const lines = beforeText.split(/@LB@/)
    if (lines.length === 0) return ''
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // 1ページ目の終了を検出
      if (line.includes('@PB@')) {
        if (isFirstPage) {
          result.push('@PB@')
          isFirstPage = false
        }
        continue
      }

      // 1ページ目のみに適用
      if (isFirstPage) {
        // 標題紙の枠線の始まりと終わりを判別
        if (pageFrameCount < 2 && /([^\u2800])\1{27,}/u.test(line)) {
          pageFrameCount++
          continue
        }

        // 標題紙両サイドの枠線を削除
        if (pageFrameCount === 1) {
          line = Array.from(line)
            .slice(1, -1).join('')
        }

        line = line.replace(/^(\u2800)+|(\u2800)+$/g, '')

        // タイトル枠の始まりと終わりを判別
        if(titleFrameCount < 2 && /([^\u2800])\1{10,}/u.test(line)) {
          titleFrameCount++
          continue
        }

        // タイトルを一行に結合
        if (titleFrameCount === 1) {
          line = Array.from(line)
            .slice(1, -1).join('')
            .replace(/^(\u2800)+|(\u2800)+$/g, '')
          if (indexOfTitleLine !== 0) {
            result[result.length - 1] = result[result.length - 1] + '\u2800' + line
            continue
          }
          indexOfTitleLine++
        }
      }

      // 目次ページ開始から前半終わりまで
      if (!isTocPage && line.includes('\u283e\u2829\u2810\u2833')) {
        result.push(line)
        isTocPage = true
        const indices: number[] = []
        for (let j = i; j < lines.length; j++) {
          let index = lines[j].replace(/\u2836\u283c/g, '\u2836\u2836').lastIndexOf('\u283c')
          if (index !== -1) indices.push(index)
        }
        const countMap = new Map<number, number>()
        for (const index of indices) {
          countMap.set(index, (countMap.get(index) || 0) + 1)
        }
        let maxCount = 0
        for (const [index, count] of countMap.entries()) {
          if (count > maxCount) {
            maxCount = count
            mostFrequentIndex = index
          }
        }
        continue
      }

      // 文字列の末尾が完結しているか判定
      if (isTocPage) {
        if (line === '') {
          isStart = true
          isEnd = true
        } else if (mostFrequentIndex !== null && line.charAt(mostFrequentIndex) === '\u283c') {
          const firstPart = line.slice(0,mostFrequentIndex + 1)
          const secondPart = line.slice(mostFrequentIndex + 1)
          const replacedFirstPart = firstPart
            .replace(/\u2800([\u2802\u2810])\1+\u2800\u283c$/u, '\u2800…\u2800\u283c')
            .replace(/\u2800{2,3}\u283c$/u, '\u2800…\u2800\u283c')
          line = replacedFirstPart + secondPart
          isEnd = true
        } else if (/\u2836\u2836\u281d\u2810\u281d\u2823\u2836\u2836/u.test(line)) {
          isEnd = true
        } else {
          isEnd = false
        }

        // 文字列の先頭の状態に応じて出力し、末尾の状態に応じて次行の先頭の状態を設定
        if (isStart) {
          if (!isEnd) isStart = false
        } else {
          line = line.replace(/^\u2800+/, '\u2800')
          result[result.length - 1] = result[result.length - 1] + line
          if (isEnd) isStart = true
          continue
        }
      }
      line = line.replace(Tables.downNumToNumRegex, "\u2831\u2810\u2821\u2813\u2800\u283c$1")
      if (line !== '') result.push(line)
    }
  }

  // ----------------------------------------------------
  // 後半の処理
  // ----------------------------------------------------
  const prefix = !startsWith28Num && startIndex === 0 ? '' : '@PB@'
  const targetText = normalizedText.slice(startIndex)
  const lines = targetText.split(/@LB@/)
  if (lines.length === 0) return ''

  let currentParagraphIndent = -1
  let indentDiff: Score = undefined
  let inBlockCount = 0
  const Chars = "[\u2813\u2816\u2836\u281b]"
  const Zorome = "([\\u2812\\u2802\\u2810])\\1{10,}"
  const frameRegex = new RegExp(`${Chars}${Zorome}`, 'u')
  const framedTitleRegex = /^\u2800*(?:\u2816([\u2812\u2802])\1+\u2800(.+?)\u2800\1+\u2832|\u2836(\u2812)\3+\u2800(.+?)\u2800\3+\u2836)$/u
  
  function extractFramedTitle(line: string): string {
    return line.replace(
      framedTitleRegex,
      (match, char1, title1, char2, title2) => {
        const title = title1 || title2
        const titleIndex = line.indexOf(title)
        return '\u2800'.repeat(titleIndex) + title
      }
    )
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // ページ１行目（ページ番号行）はスキップ
    if (line.includes('@PB@') || line.includes('@HR@')) {
      if (i === 0) {
        result.push(prefix)
      }
      continue
    }

    // 枠線の行は空行に
    if (framedTitleRegex.test(line) || frameRegex.test(line) || /([\u2812\u2802])\1{10,}/u.test(line)) {
      const trimedText = line.replace(/^(\u2800)+/g, '')
      const spaceMatch = line.match(/^(\u2800+)/)
      const spaceCount = spaceMatch ? spaceMatch[1].length : 0
        let waku = ''
      if (trimedText.startsWith('⠖') || trimedText.startsWith('⠓')) {
        for (const char of line) {
          waku += wakuTable[char] ?? char
        }
      }
      if (trimedText.startsWith('⠶')) {
        const preText = '\u2800'.repeat(spaceCount) + '┏' + trimedText.slice(1, -1) + '┓'
        waku = preText.replace(/⠒/g, '━')
      }
      if (trimedText.startsWith('⠛')) {
        const preText = '\u2800'.repeat(spaceCount) + '┗' + trimedText.slice(1, -1) + '┛'
        waku = preText.replace(/⠒/g, '━')
      }
    //   if (/^[\u2816\u2836]/.test(trimedText)) {
    //     inBlockCount++
    //   } else if (/^[\u2813\u281b]/.test(trimedText)) {
    //     inBlockCount--
    //   }
    //   if (result[result.length - 1] !== '') result.push('')
    //   if (framedTitleRegex.test(line)) {
    //     result.push(extractFramedTitle(line))
    //   }
      result.push(waku)
      continue
    }

    // 空行の場合はそのまま結果に追加してインデント状態をリセット
    if (line.length === 0) {
      result.push('')
      currentParagraphIndent = -1
      continue
    }

    // 行頭のスペース数をカウント
    const spaceMatch = line.match(/^(\u2800+)/)
    const spaceCount = spaceMatch ? spaceMatch[1].length : 0

    // 最初の1行目の処理
    if (result.length === 0) {
      result.push(line)
      if (spaceCount >= 4) {
        currentParagraphIndent = spaceCount
      }
      continue
    }

    // インデント規則に基づいて改行を詰める
    const prevLine = result[result.length - 1]

    // 結合条件1: 次の行の行頭に \u2800 がない場合（改行削除してそのまま連結）
    if (spaceCount === 0) {
      let baseLine = prevLine
      if (prevLine.length === 0) {
        result.pop()
        baseLine = result[result.length - 1]
      }
      // if (/\u2800$/.test(baseLine)) {
        result[result.length - 1] = baseLine + line
      // } else {
      //   result[result.length - 1] = baseLine + '行移し' + line
      // }
      indentDiff = undefined
      continue
    }

    // 結合条件2: 前行行頭の \u2800 が4マス以上10マス未満で、次行が「+2マス」のインデントで続く場合
    if (
        currentParagraphIndent >= 4
        && currentParagraphIndent < 10
        && spaceCount === currentParagraphIndent + 2
    ) {
      // 行頭の \u2800 を 1マス分 に縮小して結合
      const trimmedContent = line.replace(/^\u2800+/, '\u2800')
      result[result.length - 1] = prevLine + trimmedContent
      indentDiff = undefined
      continue
    }

    // 結合条件3: 前行行頭の \u2800 が10マス以上あり、次行が -2, 0, +2 マスのインデントで続く場合
    if (currentParagraphIndent >= 10) {
        if (indentDiff) {
            if (spaceCount === currentParagraphIndent + indentDiff) {
                // 行頭の \u2800 を 1マス分 に縮小して結合
                const trimmedContent = line.replace(/^\u2800+/, '\u2800')
                result[result.length - 1] = prevLine + trimmedContent
                continue
            }
        } else {
            if (
                spaceCount === currentParagraphIndent
                || spaceCount === currentParagraphIndent + 2
                || spaceCount === currentParagraphIndent -2
            ) {
                // 行頭の \u2800 を 1マス分 に縮小して結合
                const trimmedContent = line.replace(/^\u2800+/, '\u2800')
                result[result.length - 1] = prevLine + trimmedContent
                indentDiff = spaceCount - currentParagraphIndent
                continue
            }
        }
    }
    indentDiff = undefined

    // 上記の結合条件に当てはまらない場合（新しい段落の開始など）
    if (spaceCount >= 4) {
      if (inBlockCount > 0) {
        if (result[result.length - 1] !== '') {
          result.push('@LB@' + line)
        } else {
          result.push(line)
        }
      } else if (
        (spaceCount === 4 && line[4] === '⠶')
        || spaceCount >= 10
        || currentParagraphIndent >= spaceCount
      ) {
        result.push(line)
      } else {
        result.push('@PB@' + line)
      }
      currentParagraphIndent = spaceCount
    } else {
      currentParagraphIndent = -1
      result.push(line)
    }
  }
  
    const finalized: string[] = []
    // const kanaMode: OutputMode = "katakana"
    for (let i = 0; i < result.length; i++) {
        const currentLine = result[i]
        let converted = ''
        if (!getEnglishRangeIndex(currentLine)) {
            const content = currentLine.replace(/^(\u2800)+/g, '')
            if (content[0] === '⠦') {
                converted += currentLine
                const spaceMatch = result[i + 1].match(/^(\u2800+)/)
                const nextSpaceCount = spaceMatch ? spaceMatch[1].length : 0
                while (
                    !getEnglishRangeIndex(converted)
                    && nextSpaceCount < 4
                    && result[i + 1] !== ''
                ) {
                    i++
                    converted += '@LB@'
                    converted += result[i]
                }
            } else {
                converted = currentLine
            }
        } else {
            converted = currentLine
        }
        finalized.push(unicode2kana(converted, { mode: mode }))
    }

    // const finalized = result.map(line => {
    //     unicode2kana(line, { mode: "katakana" })
    // })
    return finalized
      .join('@LB@')
      .replace(/@LB@@PB@/g, '@PB@')
      .replace(/@PB@@LB@/g, '@PB@')
      .replace(/(@PB@)+/g, '@PB@')
      .replace(/(@LB@)+$/, '')
}
