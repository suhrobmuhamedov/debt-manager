export const getInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return "?"

  return parts
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
}

export const getAvatarColor = (name: string): string => {
  const palette = [
    "bg-[#e0e7ff] text-[#3730a3]",
    "bg-[#d1fae5] text-[#065f46]",
    "bg-[#fef3c7] text-[#92400e]",
    "bg-[#ffe4e6] text-[#9f1239]",
    "bg-[#e0f2fe] text-[#075985]",
    "bg-[#ccfbf1] text-[#115e59]",
  ]

  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(index)
    hash |= 0
  }

  return palette[Math.abs(hash) % palette.length]
}

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.startsWith("998") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
  }

  if (phone.startsWith("+")) return phone
  return cleaned
}

export const normalizePhone = (phone: string): string => {
  return phone.replace(/\s+/g, "")
}

export const isValidPhone = (phone: string): boolean => {
  return /^\+?\d{7,15}$/.test(normalizePhone(phone))
}
