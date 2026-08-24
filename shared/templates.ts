export type Template = { key: string; name: string; tagline: string; exercise_keys: string[] }

export const TEMPLATES: Template[] = [
  {
    key: 'core',
    name: 'Core Day',
    tagline: 'The abs from the photo start here.',
    exercise_keys: ['dead_bug', 'bird_dog', 'side_plank', 'cable_wood_chop', 'pallof_press', 'farmer_carry'],
  },
  {
    key: 'full_a',
    name: 'Full Body A',
    tagline: 'A little bit of everything, like a good buffet.',
    exercise_keys: ['goblet_squat', 'db_bench_press', 'machine_seated_row', 'lat_pulldown', 'pallof_press', 'suitcase_carry'],
  },
  {
    key: 'full_b',
    name: 'Full Body B',
    tagline: 'Same idea, different buffet.',
    exercise_keys: ['leg_press', 'machine_chest_press', 'lat_pulldown', 'kb_deadlift', 'glute_bridge', 'kb_halo'],
  },
  {
    key: 'cable_carry',
    name: 'Cable & Carry Day',
    tagline: 'Pull things. Carry things. Feel mighty.',
    exercise_keys: ['cable_pull_through', 'cable_chest_press', 'face_pull', 'reverse_wood_chop', 'farmer_carry', 'suitcase_carry'],
  },
]

export const nextTemplate = (lastKey: string | null): Template => {
  const i = TEMPLATES.findIndex((t) => t.key === lastKey)
  return TEMPLATES[(i + 1) % TEMPLATES.length]
}
