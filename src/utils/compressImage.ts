/**
 * Resizes + compresses an image File entirely in the browser (Canvas API,
 * no dependencies) before it gets uploaded to Cloudinary. Phone camera
 * photos are often 3-8MB at full resolution — uploading that raw over a
 * mobile connection is what makes the Upload screen feel like it's
 * hanging. Shrinking to a sane max dimension + JPEG quality cuts that
 * down to a few hundred KB in most cases, with no visible quality loss
 * at the sizes this app actually displays photos.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82 }: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  // Skip already-small files and non-image/GIF (canvas re-encoding would
  // strip GIF animation) — not worth the round-trip.
  if (file.size < 300_000 || file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob) return file

    // If compression somehow produced a *larger* file (rare, but possible
    // for already-optimized images), just keep the original.
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch (err) {
    console.error('compressImage: falling back to original file —', err)
    return file
  }
}
