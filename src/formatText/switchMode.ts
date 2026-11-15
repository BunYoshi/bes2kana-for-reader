import * as Types from './types'

export function switchMode(text: string, mode: Types.OutputMode): string {
        let result = ''
        for (const char of text) {
            const code = char.charCodeAt(0)
            if (mode === 'katakana') {
                if (code >= 0x3041 && code <= 0x3096) {
                    result += String.fromCharCode(char.charCodeAt(0) + 0x60)
                } else {
                    result += char
                }
            }
            if (mode === 'hiragana') {
                if (code >= 0x30a1 && code <= 0x30f6) {
                    result += String.fromCharCode(char.charCodeAt(0) - 0x60)
                } else {
                    result += char
                }
            }
        }
        return result
}