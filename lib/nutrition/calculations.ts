export type NutritionValues = { kcal?: number | null; protein_g?: number | null; carbs_g?: number | null; fat_g?: number | null; fiber_g?: number | null }

export type NutritionTotals = { kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }

export function emptyNutrition(): NutritionTotals {
  return { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
}

export function sumNutrition(items: NutritionValues[]): NutritionTotals {
  return items.reduce<NutritionTotals>((total, item) => ({
    kcal: total.kcal + (item.kcal ?? 0),
    protein_g: total.protein_g + (item.protein_g ?? 0),
    carbs_g: total.carbs_g + (item.carbs_g ?? 0),
    fat_g: total.fat_g + (item.fat_g ?? 0),
    fiber_g: total.fiber_g + (item.fiber_g ?? 0),
  }), emptyNutrition())
}

export function scaleNutrition(values: NutritionValues, quantity: number): NutritionTotals {
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Quantidade inválida')
  const nutrition = sumNutrition([values])
  return {
    kcal: nutrition.kcal * quantity,
    protein_g: nutrition.protein_g * quantity,
    carbs_g: nutrition.carbs_g * quantity,
    fat_g: nutrition.fat_g * quantity,
    fiber_g: nutrition.fiber_g * quantity,
  }
}
