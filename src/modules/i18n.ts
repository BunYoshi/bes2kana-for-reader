import { ref, computed } from 'vue'

export type Locale = 'ja' | 'en'

const messages = {
  ja: {
    title: 'BES Viewer for Screen Reader',
    selectFile: 'ファイル',
    closeFile: 'ファイルを閉じる',
    copyBody: '本文をクリップボードにコピー',
    copySuccess: '本文をクリップボードにコピーしました。',
    copyFailure: 'コピーできませんでした。ブラウザーの権限を確認してください。',
    yomiLabel: '読み',
    show: '表示',
    hide: '非表示',
    placeholder: 'ファイルを選択してください',
    backToToc: 'もくじへ もどる',
    toc: '目次',
    backToTocBraille: '⠾⠩⠐⠳⠯⠀⠾⠐⠞⠙'
  },
  en: {
    title: 'BES Viewer for Screen Reader',
    selectFile: 'File',
    closeFile: 'Close File',
    copyBody: 'Copy text to clipboard',
    copySuccess: 'Text copied to clipboard.',
    copyFailure: 'Could not copy. Check browser permissions.',
    yomiLabel: 'Plain Text',
    show: 'Show',
    hide: 'Hide',
    placeholder: 'Please select a file',
    backToToc: 'Back to TOC',
    toc: 'TOC',
    backToTocBraille: '⠃⠁⠉⠅⠀⠞⠕⠀⠞⠕⠉'
  }
}

const getInitialLocale = (): Locale => {
  if (typeof navigator === 'undefined') {
    return 'en'
  }
  const lang = navigator.language || 'en'
  return lang.startsWith('ja') ? 'ja' : 'en'
}

const currentLocale = ref<Locale>(getInitialLocale())

export function useI18n() {
  const t = (key: keyof typeof messages['ja']) => {
    return messages[currentLocale.value]?.[key] || messages['en'][key]
  }

  const locale = computed({
    get: () => currentLocale.value,
    set: (val: Locale) => {
      currentLocale.value = val
    }
  })

  return {
    t,
    locale
  }
}
