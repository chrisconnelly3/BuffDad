import type { ComponentType, ReactNode } from 'react'

// One style for every figure: 80×80 canvas, navy 2.5 stroke, round caps,
// no fills, exactly one teal accent (the moving limb or the implement).
type FigProps = { size?: number }

const Fig = ({ size = 48, children }: FigProps & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true"
    stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const teal = { stroke: 'var(--color-teal)' }

// Diagonal cable pull, high to low across the body.
export const ChopFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="31" cy="19" r="6" />
    <path d="M36 27 L39 46" />
    <path d="M39 46 L28 57 L26 68" />
    <path d="M39 46 L50 56 L54 68" />
    <path d="M37 28 L54 19" />
    <g {...teal}><path d="M56 18 L70 10" /><path d="M53 13 L58 23" /></g>
  </Fig>
)

// Pushing straight away from the chest.
export const PressFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="29" cy="15" r="6" />
    <path d="M29 23 L29 46" />
    <path d="M29 46 L23 58 L18 68" />
    <path d="M29 46 L38 56 L43 68" />
    <g {...teal}><path d="M30 27 L54 27" /><path d="M56 20 L56 34" /></g>
  </Fig>
)

// Pulling a handle in toward the ribs.
export const RowFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="54" cy="19" r="6" />
    <path d="M52 26 L46 46" />
    <path d="M46 46 L42 58 L44 70" />
    <path d="M46 46 L52 58 L55 70" />
    <path d="M51 29 L57 38 L41 33" />
    <g {...teal}><path d="M12 29 L37 32" /><path d="M38 27 L37 37" /></g>
  </Fig>
)

// Sitting between the heels, bell held at the chest.
export const SquatFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="33" cy="16" r="6" />
    <path d="M35 23 L29 42" />
    <path d="M29 42 L45 48 L42 67 L48 67" />
    <path d="M29 42 L39 52 L35 68 L41 68" />
    <path d="M35 26 L45 31" />
    <g {...teal}><circle cx="48" cy="37" r="4.5" /><path d="M44.5 34 A5 5 0 0 1 51.5 34" /></g>
  </Fig>
)

// Hips back, flat back, weight hanging under the shoulders.
export const HingeFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="55" cy="21" r="6" />
    <path d="M51 26 L33 40" />
    <path d="M33 40 L38 54 L35 70" />
    <path d="M33 40 L44 53 L42 70" />
    <path d="M49 29 L54 48" />
    <g {...teal}><circle cx="55" cy="57" r="5" /><path d="M54 48 A5 5 0 0 1 58 53" /></g>
  </Fig>
)

// Mid-stride, weight carried in one hand.
export const CarryFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="36" cy="14" r="6" />
    <path d="M36 22 L36 44" />
    <path d="M36 26 L27 40" />
    <path d="M36 26 L46 45" />
    <path d="M36 44 L41 58 L44 69" />
    <path d="M36 44 L29 57 L22 66" />
    <g {...teal}><circle cx="51" cy="56" r="4.5" /><path d="M46 45 A6 6 0 0 1 51 51" /></g>
  </Fig>
)

// One straight line, held over the floor.
export const PlankFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="63" cy="38" r="6" />
    <path d="M57 44 L20 52 L16 60" />
    <g {...teal}><path d="M56 45 L56 59 L68 59" /></g>
    <path d="M12 66 L70 66" opacity=".4" />
  </Fig>
)

// On the back, opposite limbs in the air — dead bug country.
export const FloorFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="17" cy="54" r="6" />
    <path d="M23 57 L44 59" />
    <path d="M44 59 L53 45 L64 48" />
    <path d="M44 59 L56 55 L61 62" />
    <g {...teal}><path d="M28 55 L31 33" /></g>
    <path d="M10 66 L70 66" opacity=".4" />
  </Fig>
)

// Standing tall, one knee up, arms out for balance.
export const BalanceFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="39" cy="14" r="6" />
    <path d="M39 22 L39 46" />
    <path d="M39 26 L26 35" />
    <path d="M39 26 L52 33" />
    <path d="M39 46 L38 58 L40 70" />
    <g {...teal}><path d="M39 46 L52 49 L54 62" /></g>
  </Fig>
)

// Elbow pinned, forearm doing the honest work.
export const CurlFigure = (p: FigProps) => (
  <Fig {...p}>
    <circle cx="37" cy="15" r="6" />
    <path d="M37 23 L37 47" />
    <path d="M37 47 L31 58 L30 70" />
    <path d="M37 47 L44 58 L46 70" />
    <path d="M37 26 L29 41" />
    <path d="M37 27 L45 38" />
    <g {...teal}><path d="M45 38 L55 27" /><path d="M50 23 L60 32" /></g>
  </Fig>
)

// Explicit and exhaustive — the test walks EXERCISES and demands a match.
export const ILLUSTRATION: Record<string, ComponentType<FigProps>> = {
  cable_wood_chop: ChopFigure,
  reverse_wood_chop: ChopFigure,
  cable_crunch: ChopFigure,
  standing_oblique_cable_crunch: ChopFigure,
  db_side_bend: ChopFigure,
  straight_arm_pulldown: ChopFigure,

  pallof_press: PressFigure,
  cable_chest_press: PressFigure,
  triceps_pushdown: PressFigure,
  db_bench_press: PressFigure,
  db_incline_press: PressFigure,
  db_shoulder_press: PressFigure,
  kb_overhead_press: PressFigure,
  machine_chest_press: PressFigure,
  wall_pushup: PressFigure,
  incline_pushup: PressFigure,

  face_pull: RowFigure,
  db_row: RowFigure,
  machine_seated_row: RowFigure,
  lat_pulldown: RowFigure,

  goblet_squat: SquatFigure,
  chair_squat: SquatFigure,
  wall_sit: SquatFigure,
  leg_press: SquatFigure,

  kb_deadlift: HingeFigure,
  kb_swing_light: HingeFigure,
  cable_pull_through: HingeFigure,

  farmer_carry: CarryFigure,
  suitcase_carry: CarryFigure,

  plank: PlankFigure,
  side_plank: PlankFigure,
  bird_dog: PlankFigure,

  dead_bug: FloorFigure,
  glute_bridge: FloorFigure,
  seated_knee_lift: FloorFigure,

  single_leg_stand: BalanceFigure,
  standing_march: BalanceFigure,
  step_up: BalanceFigure,
  calf_raise: BalanceFigure,

  db_curl: CurlFigure,
  biceps_cable_curl: CurlFigure,
  db_lateral_raise: CurlFigure,
  db_reverse_fly: CurlFigure,
  kb_halo: CurlFigure,
}

export function illustrationFor(key: string): ComponentType<FigProps> {
  return ILLUSTRATION[key] ?? BalanceFigure
}
