// Unsigned upload to Cloudinary. Cloud name is public; no API secret is used client-side.
const CLOUDINARY_CLOUD_NAME = "zarzop83"
const CLOUDINARY_UPLOAD_PRESET = "evacready_unsigned"

export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file selected for upload.")

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  )

  const result = await response.json()
  if (!response.ok) {
    throw new Error(result?.error?.message || "Unable to upload image to Cloudinary.")
  }
  return result.secure_url
}
