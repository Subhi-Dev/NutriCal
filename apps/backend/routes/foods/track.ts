import { z } from 'zod'

import type { Response, Request } from 'express'

import { db } from '@/db/index'
import { Meal, programFoods } from '@/db/schema/programs'
import { validateSessionToken } from '@/utils/auth/utils'
import { validateData } from '@/utils/zod-validate'
export const post = async (req: Request, res: Response) => {
  try {
    const trackRecipeSchema = z
      .object({
        foodId: z.number().int().min(0),
        programId: z.number().int().min(0),
        dayIndex: z.number().int().min(0).max(100),
        mealName: z.enum([
          'breakfast',
          'lunch',
          'dinner',
          'snack',
          'functional_food'
        ]),
        amount: z.number().min(0),
        unitId: z.number().int().min(0).nullable()
      })
      .strict()
    const requestBody: z.infer<typeof trackRecipeSchema> =
      trackRecipeSchema.parse(req.body)
    const valid = validateData(trackRecipeSchema, requestBody)
    if (valid !== 'OK') {
      return res.status(400).json({
        error: true,
        message: valid
      })
    }
    const requestToken = req.token
    const session = await validateSessionToken(requestToken)
    if (session === null) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }
    const recipes = await db
      .insert(programFoods)
      .values({
        dayIndex: requestBody.dayIndex,
        mealName: Meal[requestBody.mealName.toUpperCase() as keyof typeof Meal],
        programId: requestBody.programId,
        foodId: requestBody.foodId,
        amount: requestBody.amount.toString(),
        unitId: requestBody.unitId
      })
      .returning()

    if (recipes.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'No recipes found'
      })
    }
    return res.json({
      error: false,
      data: recipes
    })
  } catch (e) {
    console.log(JSON.stringify(e))

    return res.status(500).json({
      error: true,
      message: e
    })
  }
}
const postTrackRecipes = db
  .insert(programFoods)
  .values({
    dayIndex: 1,
    mealName: Meal.BREAKFAST,
    programId: 1,
    foodId: 1
  })
  .returning()
export type PostTrackFood = Awaited<typeof postTrackRecipes>
