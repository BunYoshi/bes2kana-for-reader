<template>
  <div id="app">
    <header>
      <nav class="navbar is-dark" :title="t('title')" id="main-header">
        <div class="navbar-brand">
          <h1 class="navbar-item app-title">{{ t('title') }}</h1>
        </div>

        <div id="navbarMenu" class="navbar-menu is-active">
          <div class="navbar-start">
            <div class="navbar-item">
              <label for="file">{{ t('selectFile') }}</label>
              <input 
                type="file" 
                id="file" 
                name="file" 
                accept=".bes,.BES" 
                @change="onFileChange" 
                ref="fileInput" 
                aria-label="ファイルを選択"
                class="custom-file-input"
              />
            </div>
            <div class="navbar-item">
              <button class="button is-small is-light custom-action-button" id="closeFile" :disabled="isFileClosed" @click="onFileClose">{{ t('closeFile') }}</button>
            </div>
          </div>
          <div class="navbar-end">
            <p class="navbar-item"><hr></p>
          </div>
        </div>
      </nav>
    </header>

    <div class="container is-fluid">
        <main class="section">
          <Braille :braille="bes" :isBrf="isBrf"></Braille>
        </main>
    </div>
    
    <footer class="footer">
      <div class="content has-text-centered">
        <p>&copy; 2026 BunYoshi | 
          <a href="https://github.com/bunyoshi/bes2kana-for-reader" target="_blank" rel="noopener noreferrer">Source Code (GitHub)</a>
        </p>
        <p style="font-size: 13px; margin-top: 5px;">
            Based on: <a href="https://github.com/brlat/brlat.github.io/" target="_blank" rel="noopener">.bes点字データをカタカナに変換</a> by 1983hachigoro (@brlat)<br>
            Original: <a href="https://github.com/shunito/bes-viewer" target="_blank" rel="noopener">UniBraille Viewer α</a> by Shunsuke Ito (@shunito)
        </p>
        <p style="font-size: 12px; margin-top: 3px;">
            Licensed under the <a href="https://raw.githubusercontent.com/bunyoshi/bes2kana-for-reader/main/LICENSE" target="_blank" rel="noopener">MIT License</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Braille from './components/Braille.vue'
import bes2unicode from './modules/bes2unicode'
import brf2unicode from './modules/brf2unicode'
import { useI18n } from './modules/i18n'

const { t, locale } = useI18n()
locale.value = 'ja'

const openFile = ref(false)
const isBrf = ref(false)
const str = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const bes = computed(() => str.value)
const isFileClosed = computed(() => !openFile.value)


// 数字関連の定義
const numbers = "[\u2801\u2803\u2809\u2819\u2811\u280b\u281b\u2813\u280a\u281a]"
const numbersArray = Array.from(numbers.replace(/[\[\]]/g, ''))
const downNumbers = "[\u2802\u2806\u2812\u2832\u2822\u2816\u2836\u2826\u2814\u2834]"
const downNumbersArray = Array.from(downNumbers.replace(/[\[\]]/g, ''))

// 下がり数字の調整
function adjustNumbers(text: string, isTocPage: boolean = false): string {
  let adjusted = text

  // 下がり数字関連の変換
  // 1. 下がり数字直後に数字が続くときにスペースを入れて後半に数符を付けなおす
  const downNumberRegex = new RegExp(`(\\u283c${downNumbers}+)(${numbers}+)`, "gu")

  // 2. 下がり数字を普通の数字に変換する
  const charMap: Record<string, string> = {}
  downNumbersArray.forEach((char, index) => {
    charMap[char] = numbersArray[index]
  })
  const downNumToNumRegex = new RegExp(`\\u283c(${downNumbers}+)`, "gu")

  // 目次の場合にだけ下がり数字に「サガリ」を付ける
  if (isTocPage) {
    adjusted = text.replace(downNumToNumRegex, "\u2831\u2810\u2821\u2813\u2800\u283c$1")
  }

  adjusted = adjusted
    .replace(downNumberRegex, "$1\u2800\u283c$2") // 1
    .replace(downNumToNumRegex, (match, digits) => {
      const convertedDigits = Array.from(digits)
        .map((c) => charMap[c as string] || c)
        .join("")
      return "\u283c" + convertedDigits
    }) // 2

  return adjusted
}

// 情報処理記号の調整
function processEnclosedSections(text: string): string {
  let transformed = text

  // アドレス囲み符号内部に対する処理
  const addressEnclosedRegex = /\u2820\u2826(.+?)\u2820\u2834/gu
  const numberSmallRegex = new RegExp(`(\\u283c${numbers}+)\\u2830`, "gu")
  transformed = transformed.replace(addressEnclosedRegex, (match, content: string) => {
    // 数符以外で始まるときに最初に外国語引用符の開き記号を付ける
    const prefix = content.startsWith("\u283c") ? "" : "\u2826"
    let buf = content
      .replace(/\u2800\u2808/g, '')
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
      .replace(/\u2839/g, '$$')
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
      .replace(numberSmallRegex, "$1\u2826") // 数字の後ろの小文字符を外国語引用符開きに
    return `${prefix}${buf}\u2834`
  })

  // 外国語引用符内部に対する処理
  const foreignQuoteRegex = /\u2826(.+?)\u2834/gu
  transformed = transformed.replace(foreignQuoteRegex, (match, content: string) => {
    const numberForeignRegex = new RegExp(`(\\u283c${numbers}+)`, "gu")
    const fullNumberBlockRegex = new RegExp(`\\u283c${numbers}+([.,]${numbers}+)+`, "gu")
    let buf = content
      .replace(/\u2820\u2836/g, '[')
      .replace(/\u2836\u2804/g, ']')
      .replace(/\u2804\u2804\u2804/g, '…')
      .replace(/\u2824\u2824/g, '--')
      .replace(/\u2838\u280c/g, '/')
      .replace(/\u2808\u282f/g, '&')
      .replace(/\u2820\u2804/g, '\u2830')
      .replace(/\u2802/g, ',')
      .replace(/\u2806/g, ';')
      .replace(/\u2812/g, ':')
      .replace(/\u2832/g, '.')
      .replace(/\u2816/g, '!')
      .replace(/\u2804/g, '\'')
      .replace(/\u2824/g, '-')
      .replace(fullNumberBlockRegex, (match) => {
        return match.replace(/([.,])/g, "$1\u283c")
      })
      .replace(numberForeignRegex, '$1\u2826') // 数字の後ろに続く英字の前に外国語引用符開きを
      .replace(/\u2830/g, '\u2834\u2826') // 残りの小文字符をすべて外国語引用符閉じ＋開きに

    return `\u2826${buf}\u2834`
  })
return transformed
}

// 文字列の最終調整（情報処理記号とカッコの調整）
function finalizeText(text: string): string {
  let finalized = processEnclosedSections(text)

  // 英字関連の変換
  const endDelimiters = "(\\u2820\\u2806|\\u2800|\\u2824|\\u2836|\\u283c|$)"
  const pRegex = new RegExp(`\\u2830\\u280f(.*?)${endDelimiters}`, "gu")

  finalized = finalized
    .replace(/\u2810\u2835/g, 'マル')
    .replace(/\u2810\u2837/g, 'サンカク')
    .replace(/\u2810\u283d/g, 'シカク')
    .replace(/\u2810\u283f/g, 'バツ')
    .replace(/\u2810\u283e/g, 'チョメ')
    .replace(/\u2830\u282a/g, '@') // 「@」を反映
    .replace(pRegex, "\u2826\u280f$1\u2834$2") // 「％」を「p」に変換
    .replace(/\u2830\u2804/g, '\u2800') // 第２カギ開き
    .replace(/\u2820\u2806/g, '\u2800') // 第２カギ閉じ
    .replace(/\u2810\u2836/g, '／') // 第２カッコ開き
    .replace(/\u2836\u2802/g, '／') // 第２カッコ閉じ
    .replace(/\u2830\u2836/g, '／') // 二重カッコ開き
    .replace(/\u2836\u2806/g, '／') // 二重カッコ閉じ
    .replace(/\u2830\u2824/g, '／') // 二重カギ開き
    .replace(/\u2824\u2806/g, '／') // 二重カギ閉じ
    .replace(/^\u2800{2}\u2836{2}\u2800/g, '\u2800\u2800') // 第１段落挿入符開き
    .replace(/\u2800\u2836{2}$/u, '') // 行頭の点訳挿入符
    .replace(/\u2836{1,2}/g, '／') // 第１カッコまたは点訳挿入符
    .replace(/\u2824\u2824/g, '\u2821\u2811\u2800') // 波線を「カラ」に変換
    .replace(/\u2810\u2800/g, '／') // 中点を削除
    .replace(/\u2810\u2802|\u2820\u2824/g, '…') // 小見出し符類
    .replace(/\u2816(?=\u2800|\u2824|@LB@|…|／)/g, '!') // 感嘆符
    .replace(/\u2816(?=\u2820\u2804|\u2830\u283c|\u2830\u2806|\u2820\u2822\u2800|\u2820\u2822@LB@)/g, '!') // 感嘆符
    .replace(/[^\u2800]\u2820\u2822(?=\u2800|@LB@)/g, (match) => {
      return match.replace(/\u2820\u2822/g, '／\u2825\u2805\u2810\u2833\u2819\u2833／')
    }) // 第３星印（ハナジルシ）の前後に「／」を挿入
    .replace(/\u2800\u2800\u2820\u2822(?=\u2800|@LB@)/g, '\u2800\u2800\u2825\u2805\u2810\u2833\u2819\u2833…') // 行頭の第３星印（ハナジルシ）後に「…」を挿入
    .replace(/[^\u2800]\u2830\u2806/g, (match) => {
      return match.replace(/\u2830\u2806/g, '／\u2808\u281d\u2812／')
    }) // 文中注記符（チュー）の前後に「／」を挿入
    .replace(/\u2800\u2800\u2830\u2806/g, '\u2800\u2800\u2808\u281d\u2812…') // 行頭の文中注記符（チュー）後に「…」を挿入
    .replace(/[^\u2800]\u2830\u283c([^\u2800]+)\u2806/gu, (match) => {
      return match.replace(/\u2830\u283c([^\u2800]+)\u2806/g, '／\u2808\u281d\u2812\u2800\u283c$1\u2824／')
    }) // 数字入り文中注記符の前後に「／」を挿入
    .replace(/\u2800\u2800\u2830\u283c([^\u2800]+)\u2806/gu, '\u2800\u2800\u2808\u281d\u2812\u2800\u283c$1…') // 数字入り文中注記符後に「…」を挿入
    .replace(/\u2820\u2804/g, '-') // 第２つなぎ符

  // アドレス囲み符号の外だけの処理
  const addressEnclosedRegex = /\u2820\u2826.+?\u2820\u2834/gu
  const parts = finalized.split(/(\u2820\u2826.+?\u2820\u2834)/gu)

  // 0. 数字直後の句点をハイフンに置き換える
  const numberPeriodRegex = new RegExp(`(\\u283c${numbers}+)\\u2832\\u2800(?!\\u2800)`, "gu")

  // 1. 数字直後のスペースにハイフンを付ける（スペースを挟んだ後の数字化防止）
  const numberSpaceRegex = new RegExp(`(\\u283c${numbers}+)\\u2800`, "gu")

  // 2. 数字直後の数符の前にスペースを入れる（日付の略記などの読み上げ時に月と日が区別できるように）
  const numberNumberRegex = new RegExp(`(\\u283c${numbers}+)\\u283c`, "gu")

  // 3. 数字をつなぐハイフンをユニコードからカナに変換する
  const numberHyphenRegex = new RegExp(`(\\u283c${numbers}+)\\u2824(?=\\u283c)`, "gu")

  const processedParts = parts.map((part) => {
    if (part.startsWith("\u2820\u2826") && part.endsWith("\u2820\u2834")) {
      return part
    }
    return part
    .replace(numberPeriodRegex, "$1\u2824…\u2800") // 0
    .replace(numberSpaceRegex, "$1\u2824\u2800") // 1
    .replace(numberNumberRegex, "$1\u2800\u283c") // 2
    .replace(numberHyphenRegex, "$1-") // 3
  })

  return processedParts.join('')
}

// BESのユニコードを整形するメイン関数
const formatBrailleText = (text: string): string => {
  if (!text) return ''

  // ユニコードの整理
  const normalizedText = text
    .replace(/@LB@.@PB@/gu, '@LB@@PB@') // 改ページ記号を整理
    .replace(/@LB@@HR@@LB@@LB@/g, '@LB@') // 見出しタグを削除
    .replace(/\u2800\u2800\u2814\u2814/g, '\u2800\u2800\u282a\u283f\u2810\u2833\u2819\u2833…') // 第１星印を「コメジルシ」に変換
    .replace(/\u2800\u2800\u2822\u2822/g, '\u2800\u2800\u282e\u2833\u2810\u2833\u2819\u2833…') // 第２星印を「ホシジルシ」に変換

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
            result[result.length - 1] = result[result.length - 1] + '\u2800' + adjustNumbers(line)
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
            .replace(/\u2800[\u2802\u2810]{2,}\u2800\u283c/u, '\u2800…\u2800\u283c')
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
          result[result.length - 1] = result[result.length - 1] + adjustNumbers(line, isTocPage)
          if (isEnd) isStart = true
          continue
        }
      }

      if (line !== '') result.push(adjustNumbers(line, isTocPage))
    }
  }

  // ----------------------------------------------------
  // 後半の処理
  // ----------------------------------------------------
  const prefix = !startsWith28Num && startIndex === 0 ? '' : '@PB@'
  const targetText = `${prefix}${normalizedText.slice(startIndex)}`
  const lines = targetText.split(/@LB@/)
  if (lines.length === 0) return ''

  let currentParagraphIndent = -1
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
    if (line.includes('@PB@')) {
      continue
    }

    // 枠線の行は空行に
    if (framedTitleRegex.test(line) || frameRegex.test(line) || /([\u2812\u2802])\1{10,}/u.test(line)) {
      const trimedText = line.replace(/^\u2800+/g, '')
      if (/^[\u2816\u2836]/.test(trimedText)) {
        inBlockCount++
      } else if (/^[\u2813\u281b]/.test(trimedText)) {
        inBlockCount--
      }
      if (result[result.length - 1] !== '') result.push('')
      if (framedTitleRegex.test(line)) {
        result.push(extractFramedTitle(line))
      }
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
      result.push(adjustNumbers(line))
      if (spaceCount >= 4) {
        currentParagraphIndent = spaceCount
      }
      continue
    }

    // インデント規則に基づいて改行を詰める
    const prevLine = result[result.length - 1]

    // 結合条件1: 次の行の行頭に \u2800 がない場合（改行削除してそのまま連結）
    if (spaceCount === 0) {
      // つなぎ目がくっつきすぎないよう、前行末尾に \u2800 がなければ補う
      const needsSpace = prevLine.length > 0 && !prevLine.endsWith('\u2800')
      result[result.length - 1] = prevLine + (needsSpace ? '\u2800' : '') + adjustNumbers(line)
      continue
    }

    // 結合条件2: 前行行頭の \u2800 が4マス以上あり、次行が「+2マス」のインデントで続く場合
    if (currentParagraphIndent >= 4 && spaceCount === currentParagraphIndent + 2) {
      // 行頭の \u2800 を 1マス分 に縮小して結合
      const trimmedContent = line.replace(/^\u2800+/, '\u2800')
      result[result.length - 1] = prevLine + adjustNumbers(trimmedContent)
      continue
    }

    // 上記の結合条件に当てはまらない場合（新しい段落の開始など）
    if (spaceCount >= 4 && spaceCount < 10) {
      if (inBlockCount > 0) {
        if (result[result.length - 1] !== '') {
          result.push('@LB@' + adjustNumbers(line))
        } else {
          result.push(adjustNumbers(line))
        }
      } else {
        result[result.length - 1] = result[result.length - 1] + '@PB@' + adjustNumbers(line)
      }
      currentParagraphIndent = spaceCount
    } else {
      currentParagraphIndent = -1
      result.push(adjustNumbers(line))
    }
  }
  return finalizeText(result.join('@LB@'))
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || !files.length) return

  const file = files[0]
  if (!file.name.toLowerCase().endsWith('.bes')) {
    window.alert('.bes点字データではありません')
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onloadend = (theFile) => {
    const target = theFile.target as FileReader
    if (target && target.readyState === FileReader.DONE) {
      openFile.value = true
      isBrf.value = false
      const result = target.result as ArrayBuffer
      const arr = new Uint8Array(result)
      str.value = formatBrailleText(bes2unicode(arr))
    }
  }

  reader.readAsArrayBuffer(file)
}

const onFileClose = () => {
  str.value = ''
  openFile.value = false
  isBrf.value = false
  if (fileInput.value) fileInput.value.value = ''
}

const onGetBesUrl = async (url: string) => {
  const isBrfUrl = url.toLowerCase().endsWith('.brf')
  try {
    const response = await fetch(url, { method: 'GET' })
    isBrf.value = isBrfUrl
    if (isBrfUrl) {
      const text = await response.text()
      str.value = brf2unicode(text)
    } else {
      const buf = await response.arrayBuffer()
      str.value = formatBrailleText(bes2unicode(new Uint8Array(buf)))
    }
    openFile.value = true
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  const params = new URL(window.location.href).searchParams
  const targetUrl = params.get('url')
  if (targetUrl && targetUrl.length > 5) {
    const ext = targetUrl.slice(-4).toLowerCase()
    if (ext === '.bes' || ext === '.brf') {
      onGetBesUrl(targetUrl)
    }
  }
})
</script>

<style scoped>
.app-title {
  font-size: 1.4rem !important;
}
.custom-file-input {
  font-size: 0.875rem;
}
.custom-action-button {
  font-size: 0.875rem;
  padding-top: 0.15rem;
  padding-bottom: 0.15rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-radius: 3px;
}
.footer a {
  text-decoration: underline;
}
</style>