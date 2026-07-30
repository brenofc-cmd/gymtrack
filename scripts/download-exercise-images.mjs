import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SOURCE_ROOT = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'
const OUTPUT_DIR = join(process.cwd(), 'public', 'exercises')

const exerciseIds = [
  'Ab_Crunch_Machine',
  'Ab_Roller',
  'Air_Bike',
  'Alternate_Incline_Dumbbell_Curl',
  'Band_Assisted_Pull-Up',
  'Barbell_Ab_Rollout',
  'Barbell_Bench_Press_-_Medium_Grip',
  'Barbell_Deadlift',
  'Barbell_Full_Squat',
  'Barbell_Hip_Thrust',
  'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Barbell_Shrug',
  'Bent_Over_Barbell_Row',
  'Butterfly',
  'Cable_Crossover',
  'Cable_Crunch',
  'Cable_Lying_Triceps_Extension',
  'Cable_Rear_Delt_Fly',
  'Cable_Rope_Overhead_Triceps_Extension',
  'Cable_Seated_Lateral_Raise',
  'Dead_Bug',
  'Decline_Reverse_Crunch',
  'Dip_Machine',
  'Dumbbell_Bench_Press',
  'Dumbbell_Lunges',
  'Dumbbell_Shoulder_Press',
  'EZ-Bar_Curl',
  'EZ-Bar_Skullcrusher',
  'Face_Pull',
  'Flat_Bench_Lying_Leg_Raise',
  'Glute_Ham_Raise',
  'Hack_Squat',
  'Hammer_Curls',
  'Hanging_Leg_Raise',
  'Hyperextensions_Back_Extensions',
  'Incline_Bench_Pull',
  'Incline_Dumbbell_Flyes',
  'Incline_Dumbbell_Press',
  'Inchworm',
  'Knee_Hip_Raise_On_Parallel_Bars',
  'Kneeling_Single-Arm_High_Pulley_Row',
  'Leg_Extensions',
  'Leg_Press',
  'Leverage_Chest_Press',
  'Leverage_Incline_Chest_Press',
  'Lying_Leg_Curls',
  'Machine_Shoulder_Military_Press',
  'One-Arm_Dumbbell_Row',
  'Pallof_Press',
  'Parallel_Bar_Dip',
  'Plank',
  'Pullups',
  'Push_Press',
  'Reverse_Hyperextension',
  'Reverse_Machine_Flyes',
  'Romanian_Deadlift',
  'Romanian_Deadlift_from_Deficit',
  'Seated_Cable_Rows',
  'Seated_Calf_Raise',
  'Seated_Leg_Curl',
  'Seated_One-arm_Cable_Pulley_Rows',
  'Side_Lateral_Raise',
  'Smith_Machine_Squat',
  'Split_Squat_with_Dumbbells',
  'Standing_Biceps_Cable_Curl',
  'Standing_Cable_Wood_Chop',
  'Standing_Calf_Raises',
  'Standing_Dumbbell_Triceps_Extension',
  'Standing_Leg_Curl',
  'Standing_Low-Pulley_One-Arm_Triceps_Extension',
  'Standing_Military_Press',
  'Stiff-Legged_Barbell_Deadlift',
  'Stomach_Vacuum',
  'Straight-Arm_Dumbbell_Pullover',
  'Straight-Arm_Pulldown',
  'T-Bar_Row_with_Handle',
  'Triceps_Pushdown_-_Rope_Attachment',
  'Triceps_Pushdown_-_V-Bar_Attachment',
  'V-Bar_Pulldown',
  'Weighted_Crunches',
  'Wide-Grip_Lat_Pulldown',
  'Walking_Treadmill',
]

await mkdir(OUTPUT_DIR, { recursive: true })

const results = await Promise.all(
  exerciseIds.map(async (id) => {
    const frames = await Promise.all(
      [0, 1].map(async (frame) => {
        const response = await fetch(`${SOURCE_ROOT}/${encodeURIComponent(id)}/${frame}.jpg`)
        if (!response.ok) {
          throw new Error(`Falha ao baixar ${id}/${frame}.jpg: HTTP ${response.status}`)
        }

        const bytes = new Uint8Array(await response.arrayBuffer())
        const suffix = frame === 0 ? '' : '_2'
        await writeFile(join(OUTPUT_DIR, `${id}${suffix}.jpg`), bytes)
        return bytes.byteLength
      })
    )
    return { id, bytes: frames.reduce((total, bytes) => total + bytes, 0) }
  })
)

const totalBytes = results.reduce((total, result) => total + result.bytes, 0)
console.log(`Baixados ${results.length} pares de execução (${(totalBytes / 1024 / 1024).toFixed(2)} MB).`)
