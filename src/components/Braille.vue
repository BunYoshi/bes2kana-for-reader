<template>
  <p v-if="isFileClose" class="is-size-2 is-size-4-mobile">{{ t('placeholder') }}</p>
  <div v-else class="besbody is-size-3 is-size-5-mobile" role="document">
    <div class="copy-controls">
      <button type="button" class="button is-small" @click="copyBody">{{ t('copyBody') }}</button>
      <p role="status" aria-live="polite">{{ copyStatus }}</p>
    </div>
    <article>
      <section v-for="(page,pno) in bes.body" :key="pno" class="columns page">
        <div class="column yomi">
          <template v-for="(line,lno) in page" :key="lno">
            <hr v-if="line === '@HR@'">
            <p v-else-if="line.length === 0"><br /></p>
            <p v-else>{{ tenji2kana(line) }}</p>
          </template>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import * as tenji from 'tenji'
// OIcon removed; not needed for tests
import { splitbraille, type ParsedBraille } from '@/modules/brailleParser'
import { unicode2brf } from '../modules/brf2unicode'
import { decodeUEB } from '../modules/uebDecoder'
import { useI18n } from '../modules/i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  braille?: string;
  isBrf?: boolean;
}>(), {
  braille: '',
  isBrf: false
})

const isFileClose = computed(() => props.braille.length === 0)
const bes = computed((): ParsedBraille => splitbraille(props.braille))
const copyStatus = ref('')
const convertedText = computed(() => bes.value.body
  .map(page => page.map(line => line === '@HR@' ? '' : tenji2kana(line)).join('\n'))
  .join('\n'))

async function copyBody() {
  const text = convertedText.value
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else if (!copyWithLegacyApi(text)) {
      throw new Error('Clipboard is unavailable')
    }
    copyStatus.value = t('copySuccess')
  } catch {
    // Try the legacy route for browsers where the Clipboard API is unavailable or denied.
    try {
      copyStatus.value = copyWithLegacyApi(text) ? t('copySuccess') : t('copyFailure')
    } catch {
      copyStatus.value = t('copyFailure')
    }
  }
}

function copyWithLegacyApi(text: string): boolean {
  if (typeof document.execCommand !== 'function') return false
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)
  try {
    return document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}

function toKatakana(value: string): string {
  return value.replace(/[\u3041-\u3096\u309D-\u309F]/g, char =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  )
}

function tenji2kana(str: string | false): string {
  if (str === false) return ''
  let line = str
  if (line.slice(0, 4) === '@H1@') line = line.slice(4)
  if (line.slice(0, 4) === '@H2@') line = line.slice(4)
  if (line.slice(0, 4) === '@HR@' || line.length === 0) return ''
  if (props.isBrf) {
    return decodeUEB(unicode2brf(line))
  }

  // tenjiライブラリでカナに変換してカタカナ化
  let kana = toKatakana(tenji.fromTenji(line))

  kana = kana
    .replace(/コーータ/g, '⇔') // 左右矢印
    .replace(/ーータ/g, '→')  // 右向き矢印
    .replace(/コーー/g, '←') // 左向き矢印
    .replace(/ッッッ/g, '……') // 点線
    .replace(/ーー/g, '─') // 長音２文字分を罫線に変換

  return kana
}
</script>

<style>
.page {
  position: relative;
  padding: 2rem 0 2rem 0;
  border-bottom: 2px solid #999;
}
.yomi {
  font-size: inherit;
  white-space: pre-wrap;
}
</style>
