export function convertChemi(text: string): string {
    return text
        .replace(/⠰⠠⠉⠕⠆/g, "CO₂")
        .replace(/⠰⠠⠓⠆⠕/g, "H₂O")
        .replace(/⠰⠠⠓⠆/g, "H₂")
        .replace(/⠰⠠⠕⠆/g, "O₂")
        .replace(/⠰⠈⠍/g, "μ")
        .replace(/⠰⠙⠠⠉/g, "℃")
}

