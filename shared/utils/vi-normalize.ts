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
 * Compare two Vietnamese strings without considering diacritics
 * Useful for case-insensitive search/matching
 *
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param caseSensitive - Whether comparison should be case-sensitive (default: false)
 * @returns true if strings match after normalization
 *
 * @example
 * compareVietnamese("Xin chào", "xin chao") // returns true
 * compareVietnamese("Cà phê", "CA PHE") // returns true
 * compareVietnamese("Học", "hoc") // returns true
 */
export function compareVietnamese(
  str1: string,
  str2: string,
  caseSensitive: boolean = false
): boolean {
  if (!str1 || !str2) return str1 === str2

  const normalized1 = normalizeVietnamese(str1)
  const normalized2 = normalizeVietnamese(str2)

  if (caseSensitive) {
    return normalized1 === normalized2
  }

  return normalized1.toLowerCase() === normalized2.toLowerCase()
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
