// Conversion of number amount to Russian words for currency (rubles/kopecks)

const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const onesFeminine = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
const teens = [
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
  'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'
]
const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']

function getPlural(n: number, one: string, two: string, five: string): string {
  const abs = Math.abs(n) % 100
  if (abs >= 11 && abs <= 19) return five
  const last = abs % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return two
  return five
}

function convertTriplet(num: number, feminine: boolean): string {
  const h = Math.floor(num / 100)
  const remainder = num % 100
  const t = Math.floor(remainder / 10)
  const o = remainder % 10

  const parts: string[] = []
  if (h > 0) parts.push(hundreds[h])

  if (t === 1) {
    parts.push(teens[o])
  } else {
    if (t > 1) parts.push(tens[t])
    if (o > 0) parts.push(feminine ? onesFeminine[o] : ones[o])
  }

  return parts.join(' ')
}

/**
 * Converts a numeric amount to Russian words for currency.
 * Example: 231665.31 → "Двести тридцать одна тысяча шестьсот шестьдесят пять рублей тридцать одна копейка"
 */
export function amountToWordsRu(amount: number): string {
  const rubles = Math.floor(Math.abs(amount))
  const kopecks = Math.round((Math.abs(amount) - rubles) * 100)

  if (rubles === 0 && kopecks === 0) {
    return 'Ноль рублей 00 копеек'
  }

  const parts: string[] = []

  if (rubles === 0) {
    parts.push('ноль')
  } else {
    // Billions
    const billions = Math.floor(rubles / 1000000000)
    if (billions > 0) {
      parts.push(convertTriplet(billions, false))
      parts.push(getPlural(billions, 'миллиард', 'миллиарда', 'миллиардов'))
    }

    // Millions
    const millions = Math.floor((rubles % 1000000000) / 1000000)
    if (millions > 0) {
      parts.push(convertTriplet(millions, false))
      parts.push(getPlural(millions, 'миллион', 'миллиона', 'миллионов'))
    }

    // Thousands (feminine: тысяча)
    const thousands = Math.floor((rubles % 1000000) / 1000)
    if (thousands > 0) {
      parts.push(convertTriplet(thousands, true))
      parts.push(getPlural(thousands, 'тысяча', 'тысячи', 'тысяч'))
    }

    // Remainder (units)
    const rem = rubles % 1000
    if (rem > 0) {
      parts.push(convertTriplet(rem, false))
    }
  }

  parts.push(getPlural(rubles, 'рубль', 'рубля', 'рублей'))

  // Kopecks as words
  if (kopecks > 0) {
    parts.push(convertTriplet(kopecks, true))
    parts.push(getPlural(kopecks, 'копейка', 'копейки', 'копеек'))
  } else {
    parts.push('00 копеек')
  }

  const result = parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  return result.charAt(0).toUpperCase() + result.slice(1)
}

