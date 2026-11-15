import * as Types from './types'
import { convertAddress } from './convertAddress'
import { convertChemi } from './convertChemi'
import { convertEnglish } from './convertEnglish'
import { convertAlphabets } from './convertAlphabets'
import { convertNumbers } from './convertNumbers'
import { convertKana } from './convertKana'
import { convertSymbols } from './convertSymbols'
import { switchMode } from './switchMode'

export function unicode2kana(brailleText: string, options: Types.EngineOptions): string {

  let result = convertAddress(brailleText)
  result = convertChemi(result)
  result = convertEnglish(result)
  result = convertAlphabets(result)
  result = convertNumbers(result)
  result = convertKana(result) 
  result = convertSymbols(result)
  result = switchMode(result, options.mode)

  return result
}