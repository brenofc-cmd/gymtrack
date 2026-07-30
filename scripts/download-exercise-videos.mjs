import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { spawn } from 'node:child_process'

const OUTPUT_DIR = join(process.cwd(), 'public', 'exercises', 'videos')
const AVCONVERT = '/usr/bin/avconvert'

const videos = [
  ['wger-206-dumbbell-walking-lunge.m4v', 'https://wger.de/media/exercise-video/206/47a65c45-6fd1-4181-b71a-3a6c882e516b.MOV'],
  ['wger-222-face-pull.m4v', 'https://wger.de/media/exercise-video/222/245a824b-cd39-45f2-b251-2c0b7efead0d.MOV'],
  ['wger-294-hip-thrust.m4v', 'https://wger.de/media/exercise-video/294/45bacf4b-1bb6-4d47-8bd1-9f00eddd4019.MOV'],
  ['wger-75-dumbbell-bench-press.m4v', 'https://wger.de/media/exercise-video/75/080c799b-8afd-4130-8d72-9cef0cd79f54.MOV'],
  ['wger-91-barbell-curl.m4v', 'https://wger.de/media/exercise-video/91/483f4bff-e108-41f1-8e7b-0caf24952552.MOV'],
  ['wger-73-barbell-bench-press.m4v', 'https://wger.de/media/exercise-video/73/2bdb390c-312c-4497-a722-5eed2c823e5a.MOV'],
  ['wger-194-dips.m4v', 'https://wger.de/media/exercise-video/194/d039ec90-474d-47a9-a3ad-bf0b00828c82.MP4'],
  ['wger-95-cable-curl.m4v', 'https://wger.de/media/exercise-video/95/ab770931-47d3-44fd-aef0-ac7a64c3b794.MOV'],
  ['wger-211-dumbbell-triceps-extension.m4v', 'https://wger.de/media/exercise-video/211/85f6eb25-a76c-409e-9af9-497794ac0dfb.MOV'],
  ['wger-272-hammer-curl.m4v', 'https://wger.de/media/exercise-video/272/df069052-2173-4f24-855f-a0eebe729f24.MOV'],
  ['wger-246-skull-crusher.m4v', 'https://wger.de/media/exercise-video/246/75eb8c88-922e-45c5-8be3-ac073f62b63f.MP4'],
  ['wger-365-lying-leg-curl.m4v', 'https://wger.de/media/exercise-video/365/becaf013-5044-40d0-bae9-7ed60c973737.MOV'],
  ['wger-366-seated-leg-curl.m4v', 'https://wger.de/media/exercise-video/366/43df4b79-d4c3-4fbf-bcb5-e0d825b84120.MOV'],
  ['wger-348-lateral-raise.m4v', 'https://wger.de/media/exercise-video/348/de69928a-8a35-4096-821c-1f46de5e0e03.MOV'],
  ['wger-349-one-arm-cable-lateral-raise.m4v', 'https://wger.de/media/exercise-video/349/9896d82e-d8b6-48af-bdd5-b8545dc523e9.MOV'],
  ['wger-82-bent-over-rear-delt-raise.m4v', 'https://wger.de/media/exercise-video/82/28b53647-27e7-47cf-8852-2ee666c8b628.MOV'],
  ['wger-341-smith-squat.m4v', 'https://wger.de/media/exercise-video/341/0cbfeace-dda9-4166-8424-f51358e88a4f.MOV'],
  ['wger-803-one-arm-cable-triceps.m4v', 'https://wger.de/media/exercise-video/803/99e0001f-217a-4b11-823c-014d24a5415e.MOV'],
  ['wger-367-standing-leg-curl.m4v', 'https://wger.de/media/exercise-video/367/6c24960c-20ab-4ef9-90f8-cf53e630ccec.MOV'],
  ['wger-375-hack-squat.m4v', 'https://wger.de/media/exercise-video/375/effa7a81-dbdd-4014-83ee-ddf0fd835301.MOV'],
  ['wger-475-pull-up.m4v', 'https://wger.de/media/exercise-video/475/83067ffe-ccb9-4e22-8507-5131b211ce74.MOV'],
  ['wger-477-assisted-pull-up.m4v', 'https://wger.de/media/exercise-video/477/2e23bb52-2782-40c8-bf88-fa2d2e2a9a0d.MOV'],
  ['wger-512-seated-row.m4v', 'https://wger.de/media/exercise-video/512/fff4c294-93f0-4926-b3a2-bf59ad4afaa5.MOV'],
  ['wger-543-machine-shoulder-press.m4v', 'https://wger.de/media/exercise-video/543/dbfd396b-1aab-4a64-a50b-2c31ff0a2cf7.MOV'],
  ['wger-538-incline-barbell-bench-press.m4v', 'https://wger.de/media/exercise-video/538/4349a6f6-4cee-4c09-828b-c5e7fc2c1ff1.MOV'],
  ['wger-567-dumbbell-shoulder-press.m4v', 'https://wger.de/media/exercise-video/567/64f33c19-1d96-4b7c-af17-6c6a4941c614.MOV'],
  ['wger-590-seated-calf-raise.m4v', 'https://wger.de/media/exercise-video/590/a325ae2e-686b-4a1f-aff2-ba37fa3fa157.MOV'],
  ['wger-570-shrug.m4v', 'https://wger.de/media/exercise-video/570/bd1f14a3-9d2b-4ec0-b6b9-e82d739f7e60.MOV'],
  ['wger-622-standing-calf-raise.m4v', 'https://wger.de/media/exercise-video/622/35b7b625-77fd-4c09-8c57-3ad0f2f23175.MOV'],
  ['wger-371-leg-press.m4v', 'https://wger.de/media/exercise-video/371/6aae16b4-01b9-4eb4-935c-3250f84d2c59.MOV'],
  ['wger-507-romanian-deadlift.m4v', 'https://wger.de/media/exercise-video/507/307e7276-a14d-4ea0-b579-f5b0dbc6f5af.MOV'],
  ['wger-537-incline-dumbbell-bench-press.m4v', 'https://wger.de/media/exercise-video/537/b9c937e9-daeb-42a9-be8e-7a77e368478c.MOV'],
  ['wger-659-cable-triceps-extension.m4v', 'https://wger.de/media/exercise-video/659/1f2eb3b6-3185-429f-8330-26dc88f39aff.MOV'],
]

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} encerrou com código ${code}`))
    })
  })
}

async function download(url, destination) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`)
  await writeFile(destination, new Uint8Array(await response.arrayBuffer()))
}

async function verifyWgerAttribution(fileName, sourceUrl) {
  const exerciseId = fileName.match(/^wger-(\d+)-/)?.[1]
  if (!exerciseId) throw new Error(`Nome sem ID wger: ${fileName}`)
  const response = await fetch(`https://wger.de/api/v2/video/?exercise=${exerciseId}&limit=100`)
  if (!response.ok) throw new Error(`Falha ao consultar atribuição do exercício ${exerciseId}: HTTP ${response.status}`)
  const payload = await response.json()
  const media = payload.results.find((item) => item.video === sourceUrl)
  if (!media) throw new Error(`O vídeo ${sourceUrl} não existe mais na API wger.`)
  if (media.license !== 2 || media.license_author !== 'Goulart') {
    throw new Error(`Atribuição inesperada para ${fileName}: licença=${media.license}, autor=${media.license_author}`)
  }
}

async function processVideo([fileName, sourceUrl], temporaryDir) {
  const sourcePath = join(temporaryDir, basename(new URL(sourceUrl).pathname))
  const outputPath = join(OUTPUT_DIR, fileName)
  await verifyWgerAttribution(fileName, sourceUrl)
  await download(sourceUrl, sourcePath)
  await run(AVCONVERT, [
    '--source', sourcePath,
    '--preset', 'PresetAppleM4VCellular',
    '--output', outputPath,
    '--replace',
    '--start', '0.5',
    '--duration', '8',
  ])
  await rm(sourcePath, { force: true })
  console.log(`✓ ${fileName}`)
}

await access(AVCONVERT).catch(() => {
  throw new Error('Este script requer /usr/bin/avconvert (macOS).')
})
await mkdir(OUTPUT_DIR, { recursive: true })
const temporaryDir = await mkdtemp(join(tmpdir(), 'gymtrack-exercise-videos-'))

try {
  const requestedFiles = process.argv.slice(2)
  const queue = requestedFiles.length === 0
    ? [...videos]
    : videos.filter(([fileName]) =>
        requestedFiles.some((requested) => fileName.includes(requested))
      )
  if (queue.length === 0) throw new Error('Nenhum vídeo corresponde ao filtro informado.')
  const selectedCount = queue.length
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item) await processVideo(item, temporaryDir)
    }
  })
  await Promise.all(workers)
  console.log(`Convertidos ${selectedCount} vídeos para celular.`)
} finally {
  await rm(temporaryDir, { recursive: true, force: true })
}
