/**
 * Rasterize public/logo.svg into the PWA + favicon PNG set.
 * Run with: node scripts/generate-icons.mjs
 * Produces: public/pwa-192.png, public/pwa-512.png,
 *           public/apple-touch-icon.png (180), public/favicon-32.png
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'public', 'logo.svg')

const targets = [
  { out: 'pwa-192.png', size: 192 },
  { out: 'pwa-512.png', size: 512 },
  { out: 'apple-touch-icon.png', size: 180 },
  { out: 'favicon-32.png', size: 32 },
]

for (const { out, size } of targets) {
  await sharp(source).resize(size, size).png().toFile(join(root, 'public', out))
  console.log(`wrote ${out} (${size}px)`)
}
