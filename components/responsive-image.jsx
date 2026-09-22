'use client'
import { motion } from 'framer-motion'

export function imageSource(src, width) {
  try {
    const url = new URL(src)
    if (!['images.unsplash.com', 'images.pexels.com'].includes(url.hostname)) return src
    url.searchParams.set('w', String(width))
    url.searchParams.set('q', '75')
    url.searchParams.delete('fm')
    url.searchParams.set('auto', url.hostname === 'images.unsplash.com' ? 'format' : 'compress')
    return url.href
  } catch { return src }
}
export default function ResponsiveImage({ src, alt = '', priority = false, sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw', ...props }) {
  const isLocal = src.startsWith('/')
  return <motion.img {...props} src={imageSource(src, 1280)}
    srcSet={isLocal ? undefined : [320, 640, 960, 1280, 1920].map(w => `${imageSource(src, w)} ${w}w`).join(', ')}
    sizes={isLocal ? undefined : sizes} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" />
}
