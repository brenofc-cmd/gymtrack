import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const GIF_MAP: Record<string, string> = {
  'Supino inclinado (barra)':             `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  'Supino inclinado com halteres':        `${BASE}/Incline_Dumbbell_Press/0.jpg`,
  'Crossover alto (peito superior)':      `${BASE}/Cable_Crossover/0.jpg`,
  'Desenvolvimento com halteres':         `${BASE}/Dumbbell_Shoulder_Press/0.jpg`,
  'Elevação lateral (cabo)':              `${BASE}/Cable_Shoulder_Press/0.jpg`,
  'Elevação lateral inclinada (haltere)': `${BASE}/Side_Lateral_Raise/0.jpg`,
  'Tríceps corda':                        `${BASE}/Triceps_Pushdown_-_Rope_Attachment/0.jpg`,
  'Tríceps testa com halteres':           `${BASE}/EZ-Bar_Skullcrusher/0.jpg`,
  'Cable crunch':                         `${BASE}/Cable_Crunch/0.jpg`,
  'Agachamento livre':                    `${BASE}/Barbell_Full_Squat/0.jpg`,
  'Leg press (pés altos e fechados)':     `${BASE}/Leg_Press/0.jpg`,
  'Cadeira extensora':                    `${BASE}/Leg_Extensions/0.jpg`,
  'Mesa flexora':                         `${BASE}/Lying_Leg_Curls/0.jpg`,
  'Stiff (barra ou halteres)':            `${BASE}/Romanian_Deadlift/0.jpg`,
  'Panturrilha em pé (unilateral)':       `${BASE}/Standing_Calf_Raises/0.jpg`,
  'Capitão (elevação de joelhos)':        `${BASE}/Hanging_Leg_Raise/0.jpg`,
  'Straight arm pulldown (ativação lat)': `${BASE}/Straight-Arm_Pulldown/0.jpg`,
  'Barra fixa pronada (pull-up)':         `${BASE}/Wide-Grip_Lat_Pulldown/0.jpg`,
  'Remada curvada (barra)':               `${BASE}/Bent_Over_Barbell_Row/0.jpg`,
  'Pulldown pegada neutra':               `${BASE}/Close-Grip_Front_Lat_Pulldown/0.jpg`,
  'Remada unilateral (haltere)':          `${BASE}/One-Arm_Dumbbell_Row/0.jpg`,
  'Rosca direta (barra)':                 `${BASE}/Barbell_Curl/0.jpg`,
  'Rosca martelo (haltere)':              `${BASE}/Alternate_Hammer_Curl/0.jpg`,
  'Oblíquo no cabo (woodchop)':           `${BASE}/Cable_Hip_Adduction/0.jpg`,
  'Ab wheel':                             `${BASE}/Ab_Roller/0.jpg`,
}

async function main() {
  console.log('🔄 Atualizando gif_urls...\n')
  let ok = 0
  let fail = 0

  for (const [name_pt, gif_url] of Object.entries(GIF_MAP)) {
    const { error } = await supabase
      .from('exercises')
      .update({ gif_url })
      .eq('name_pt', name_pt)

    if (error) {
      console.error(`❌ ${name_pt}: ${error.message}`)
      fail++
    } else {
      console.log(`✅ ${name_pt}`)
      ok++
    }
  }

  console.log(`\n✔ ${ok} atualizados, ${fail} erros`)
}

main()
