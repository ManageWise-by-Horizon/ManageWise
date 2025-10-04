/**
 * Upload an image to ImgBB
 * @param file - The image file to upload
 * @returns The URL of the uploaded image
 */
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY

  if (!apiKey) {
    throw new Error("ImgBB API key is not configured")
  }

  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/...;base64, prefix
      const base64String = result.split(",")[1]
      resolve(base64String)
    }
    reader.onerror = (error) => reject(error)
  })

  // Upload to ImgBB
  const formData = new FormData()
  formData.append("key", apiKey)
  formData.append("image", base64)

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload image to ImgBB")
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error?.message || "Failed to upload image")
  }

  return data.data.url
}
