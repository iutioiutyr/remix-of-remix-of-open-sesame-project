function extractGDriveId(url: string): string | null {
  if (!url) return null
  const m = url.match(/\/file\/d\/([^/?#]+)/)
  if (m) return m[1]
  const m2 = url.match(/[?&]id=([^&]+)/)
  if (m2) return m2[1]
  return null
}

export function toDisplayImage(url: string): string {
  const id = extractGDriveId(url)
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w800`
  return url
}

export function toDirectDownload(url: string): string {
  const id = extractGDriveId(url)
  if (id) return `https://drive.google.com/uc?export=download&id=${id}`
  return url
}

export function toEmbedUrl(url: string): string {
  const id = extractGDriveId(url)
  if (id) return `https://drive.google.com/file/d/${id}/preview`
  return url
}
