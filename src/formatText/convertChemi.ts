export function convertChemi(text: string): string {
    return text
        .replace(/⠰⠠⠉⠕⠆/g, "CO₂")
        .replace(/⠰⠠⠓⠆⠕/g, "H₂O")
        .replace(/⠰⠠⠓⠆/g, "H₂")
        .replace(/⠰⠠⠕⠆/g, "O₂")
        .replace(/⠰⠅⠍⠣/g, "km²")
        .replace(/⠰⠉⠍⠣/g, "cm²")
        .replace(/⠰⠍⠍⠣/g, "mm²")
        .replace(/⠰⠍⠣/g, "m²")
        .replace(/⠰⠅⠍⠩/g, "km³")
        .replace(/⠰⠉⠍⠩/g, "cm³")
        .replace(/⠰⠍⠍⠩/g, "mm³")
        .replace(/⠰⠍⠩/g, "m³")
        .replace(/⠰⠈⠍/g, "μ")
        .replace(/⠰⠙⠠⠉/g, "℃")
}

