/**
 * Vietnamese Text Normalization Utility
 *
 * This utility removes Vietnamese diacritical marks (tones and special characters)
 * to enable search and matching for users who cannot type Vietnamese with proper accents.
 *
 * Example:
 * - "Xin chào" → "xin chao"
 * - "Cà phê" → "ca phe"
 * - "Học sinh" → "hoc sinh"
 */

/**
 * Map of Vietnamese characters with diacritics to their base form
 */
const VIETNAMESE_MAP: Record<string, string> = {
  // Lowercase vowels with tones
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  'đ': 'd',

  // Uppercase vowels with tones
  'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
  'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
  'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
  'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
  'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
  'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
  'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
  'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
  'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
  'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
  'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
  'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
  'Đ': 'D',
}

/**
 * Normalize Vietnamese text by removing all diacritical marks
 * @param text - The Vietnamese text to normalize
 * @returns The normalized text without diacritics
 *
 * @example
 * normalizeVietnamese("Xin chào") // returns "xin chao"
 * normalizeVietnamese("Cà phê") // returns "ca phe"
 * normalizeVietnamese("Học sinh") // returns "hoc sinh"
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return ''

  let normalized = text

  // Replace each Vietnamese character with its base form
  for (const [accented, base] of Object.entries(VIETNAMESE_MAP)) {
    normalized = normalized.replace(new RegExp(accented, 'g'), base)
  }

  return normalized
}

/**
 * Normalize Vietnamese text for exercise comparison by:
 * 1. Removing diacritics
 * 2. Removing punctuation marks (.,!?;:'"()[]{}...)
 * 3. Normalizing whitespace
 * 4. Converting to lowercase (optional)
 *
 * This is useful for comparing user input with expected answers in exercises
 * where minor punctuation differences shouldn't mark the answer as incorrect.
 *
 * @param text - The Vietnamese text to normalize
 * @param options - Normalization options
 * @returns The normalized text
 *
 * @example
 * normalizeForComparison("Xin chào, bạn khỏe không?")
 * // returns "xin chao ban khoe khong"
 *
 * normalizeForComparison("Tôi ăn cơm.")
 * // returns "toi an com"
 *
 * normalizeForComparison("Hôm nay, trời đẹp!", { preserveCase: true })
 * // returns "Hom nay troi dep"
 */
export function normalizeForComparison(
  text: string,
  options: {
    preserveCase?: boolean
    preserveWhitespace?: boolean
  } = {}
): string {
  if (!text) return ''

  const { preserveCase = false, preserveWhitespace = false } = options

  // Step 1: Remove diacritics
  let normalized = normalizeVietnamese(text)

  // Step 2: Remove all punctuation marks using Unicode property escapes
  // \p{P} matches any punctuation character
  // \p{S} matches any symbol character (like currency, math symbols, etc.)
  normalized = normalized.replace(/[\p{P}\p{S}]+/gu, '')

  // Step 3: Normalize whitespace (replace multiple spaces with single space)
  if (!preserveWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ').trim()
  }

  // Step 4: Convert to lowercase (if not preserving case)
  if (!preserveCase) {
    normalized = normalized.toLowerCase()
  }

  return normalized
}

/**
 * Compare two Vietnamese strings without considering diacritics
 * Useful for case-insensitive search/matching
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param options - Comparison options
 * @returns true if strings match after normalization
 *
 * @example
 * compareVietnamese("Xin chào", "xin chao") // returns true
 * compareVietnamese("Cà phê", "CA PHE") // returns true
 * compareVietnamese("Học", "hoc") // returns true
 * compareVietnamese("Xin chào!", "Xin chao", { ignorePunctuation: true }) // returns true
 */
export function compareVietnamese(
  str1: string,
  str2: string,
  options: {
    caseSensitive?: boolean
    ignorePunctuation?: boolean
  } = {}
): boolean {
  if (!str1 || !str2) return str1 === str2

  const { caseSensitive = false, ignorePunctuation = false } = options

  let normalized1: string
  let normalized2: string

  if (ignorePunctuation) {
    // Use full normalization including punctuation removal
    normalized1 = normalizeForComparison(str1, { preserveCase: caseSensitive })
    normalized2 = normalizeForComparison(str2, { preserveCase: caseSensitive })
    return normalized1 === normalized2
  } else {
    // Only remove diacritics
    normalized1 = normalizeVietnamese(str1)
    normalized2 = normalizeVietnamese(str2)

    if (caseSensitive) {
      return normalized1 === normalized2
    }

    return normalized1.toLowerCase() === normalized2.toLowerCase()
  }
}

/**
 * Check if a Vietnamese string contains a search term (with normalization)
 * Useful for search functionality where users might not type with diacritics
 *
 * @param text - The Vietnamese text to search in
 * @param searchTerm - The search term (can be with or without diacritics)
 * @param caseSensitive - Whether search should be case-sensitive (default: false)
 * @returns true if text contains the search term after normalization
 *
 * @example
 * searchVietnamese("Xin chào bạn", "chao") // returns true
 * searchVietnamese("Cà phê sữa đá", "ca phe") // returns true
 * searchVietnamese("Học tiếng Việt", "hoc tieng viet") // returns true
 */
export function searchVietnamese(
  text: string,
  searchTerm: string,
  caseSensitive: boolean = false
): boolean {
  if (!text || !searchTerm) return false

  const normalizedText = normalizeVietnamese(text)
  const normalizedSearch = normalizeVietnamese(searchTerm)

  if (caseSensitive) {
    return normalizedText.includes(normalizedSearch)
  }

  return normalizedText.toLowerCase().includes(normalizedSearch.toLowerCase())
}
