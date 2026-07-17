import crypto from 'crypto'

/** Normalize Indian mobile numbers to E.164 (+91XXXXXXXXXX). */
export function normalizeIndianPhone(input) {
  const digits = String(input || '').replace(/\D/g, '')
  if (!digits) return null

  let national = digits
  if (national.startsWith('91') && national.length === 12) {
    national = national.slice(2)
  } else if (national.startsWith('0') && national.length === 11) {
    national = national.slice(1)
  }

  if (!/^[6-9]\d{9}$/.test(national)) return null
  return `+91${national}`
}

export function displayPhone(phone) {
  if (!phone) return ''
  const digits = String(phone).replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2)
  }
  return digits
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex')
}

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000))
}
