import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "")

  // If the number is 10 digits, assume it's a US number and prepend '1'
  if (digitsOnly.length === 10) {
    return `1${digitsOnly}`
  }

  // If the number is 11 digits and starts with '1', it's already in a standard format
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return digitsOnly
  }

  // Otherwise, return the digits as is (for international numbers or other cases)
  return digitsOnly
}

export function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src) // Clean up blob URL
      let { width, height } = img

      // Only resize if the image exceeds the max dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return reject(new Error("Could not get canvas context"))
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Canvas to Blob conversion failed"))
          }
          // Create a new file with the original name but resized content
          const newFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })
          resolve(newFile)
        },
        file.type,
        0.95, // Use a high quality setting to preserve detail for the AI
      )
    }
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src) // Clean up blob URL on error
      reject(error)
    }
  })
}
