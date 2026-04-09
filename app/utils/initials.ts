export function getInitials(source: string, fallback = 'A') {
  const normalizedSource = source.trim()

  if (!normalizedSource) {
    return fallback
  }

  const words = normalizedSource.split(/\s+/).filter(Boolean)

  if (words.length === 1) {
    const singleWord = words[0] ?? ''
    const singleWordLetters = Array.from(singleWord).filter((character) => /\p{L}/u.test(character))
    return (singleWordLetters.slice(0, 2).join('') || fallback).toUpperCase()
  }

  const uppercaseLetters = Array.from(normalizedSource).filter((character) =>
    /\p{Lu}/u.test(character)
  )

  if (uppercaseLetters.length >= 2) {
    return uppercaseLetters.slice(0, 2).join('')
  }

  const allLetters = Array.from(normalizedSource).filter((character) => /\p{L}/u.test(character))
  return (allLetters.slice(0, 2).join('') || fallback).toUpperCase()
}
