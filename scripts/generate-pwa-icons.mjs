#!/usr/bin/env node
/**
 * Gera os ícones da PWA a partir da identidade visual do GymTrack.
 *
 * Motivo: o manifest referenciava /icons/icon-192.png e /icons/icon-512.png,
 * mas public/icons/ não existia — a instalação da PWA ficava sem ícone e as
 * URLs davam 404 (bug P0 da auditoria 10/10).
 *
 * Sem dependência nova: escreve PNG cru (RGB, filtro 0) usando apenas zlib do
 * Node. Determinístico — rodar de novo produz o mesmo arquivo.
 *
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const BG = [0x09, 0x09, 0x0b] // --background
const FG = [0xa3, 0xe6, 0x35] // --primary (verde-lima da marca)

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeAndData))
  return Buffer.concat([length, typeAndData, crc])
}

function encodePng(size, pixelAt) {
  const stride = size * 3
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0 // filtro "None"
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = pixelAt(x, y)
      const offset = y * (stride + 1) + 1 + x * 3
      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  // 10..12 = compression, filter, interlace = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Halter estilizado, desenhado em coordenadas relativas (0–1) para escalar em
 * qualquer tamanho. `scale` encolhe o desenho para respeitar a zona segura de
 * ícones maskable (o recorte circular corta ~10% de cada borda).
 */
function dumbbellAt(size, scale) {
  const bars = [
    // [x0, y0, x1, y1] em fração do lado
    [0.3125, 0.4609, 0.6875, 0.5391], // barra central
    [0.25, 0.3438, 0.3125, 0.6563], // placa interna esquerda
    [0.6875, 0.3438, 0.75, 0.6563], // placa interna direita
    [0.1875, 0.4063, 0.25, 0.5938], // placa externa esquerda
    [0.75, 0.4063, 0.8125, 0.5938], // placa externa direita
  ]
  const center = size / 2
  return (x, y) => {
    // Aplica a escala em torno do centro
    const sx = (x - center) / scale + center
    const sy = (y - center) / scale + center
    for (const [x0, y0, x1, y1] of bars) {
      if (sx >= x0 * size && sx <= x1 * size && sy >= y0 * size && sy <= y1 * size) return FG
    }
    return BG
  }
}

const OUT_DIR = path.resolve(import.meta.dirname, '../public/icons')
mkdirSync(OUT_DIR, { recursive: true })

const icons = [
  // `any`: desenho ocupa mais área
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  // `maskable`: encolhido para caber na zona segura de recortes circulares
  { file: 'icon-192-maskable.png', size: 192, scale: 0.72 },
  { file: 'icon-512-maskable.png', size: 512, scale: 0.72 },
  // iOS não aplica máscara: usa o desenho cheio
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
]

for (const { file, size, scale } of icons) {
  writeFileSync(path.join(OUT_DIR, file), encodePng(size, dumbbellAt(size, scale)))
  console.log(`gerado: public/icons/${file} (${size}×${size})`)
}
