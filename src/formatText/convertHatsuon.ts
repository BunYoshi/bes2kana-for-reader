import { hatsuonTable } from "./tables"

export function convertHatsuon(text: string): string {
    const sortedKeys = Object
        .keys(hatsuonTable)
        .sort((a, b) => b.length - a.length)
    let converted = text
    for (const key of sortedKeys) {
        const value = hatsuonTable[key]
        // converted = converted.replaceAll(key, value)
        converted = converted.split(key).join(value)
    }
    let result = ''
    for (let i = 0; i < converted.length; i++) {
        const char = converted[i];
        if (char === '⠸') {
        i++
            let accent = converted[i] + '\u0301'
            result += accent.normalize('NFC')
            continue
        }
        if (char === '⠘') {
        i++
            let accent = converted[i] + '\u0300'
            result += accent.normalize('NFC')
            continue
        }
        result += char
    }
    return '[' + result + ']'
}