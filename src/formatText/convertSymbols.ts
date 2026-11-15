 export function convertSymbols(text: string): string {
    const result = text
    .replace(/☆☆☆/g, 'ハナジルシ')
    .replace(/☆☆/g, 'コメジルシ…')
    .replace(/☆/g, 'ホシジルシ…')
    .replace(/\/\/＿/g, '／')
    .replace(/\/＿/g, '／')
    .replace(/＜/g, '「')
    .replace(/＞/g, '」')
    .replace(/※/g, 'チュー')
    .replace(/○/g, 'マル')
    .replace(/△/g, 'サンカク')
    .replace(/□/g, 'シカク')
    .replace(/×/g, 'バツ')
    .replace(/◇/g, 'チョメ')
    .replace(/～/g, 'カラ')
    .replace(/(?<=.)(?<!　|。|？|@|！|／)　{2}(?!　|／)/gu, '、') // ２マス分のスペースは「、」に変換
    return result
 }