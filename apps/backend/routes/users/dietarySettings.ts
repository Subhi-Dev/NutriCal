import { eq } from 'drizzle-orm'
import { z } from 'zod'

import type { Request, Response } from 'express'

import { db } from '@/db/index'
import { dietarySettings } from '@/db/schema/user'
import { validateSessionToken } from '@/utils/auth/utils'

export const get = async (req: Request, res: Response) => {
  try {
    const requestToken = req.token
    const session = await validateSessionToken(requestToken)
    if (!session) {
      return res.status(401).json({ error: true, message: 'Unauthorized' })
    }

    let dietarySettingsData = await db.query.dietarySettings.findFirst({
      where: eq(dietarySettings.userId, session.user!.id)
    })

    if (!dietarySettingsData) {
      if (
        !session.user!.weight ||
        !session.user!.height ||
        !session.user!.dateOfBirth
      ) {
        const dietarySettingsData = await db
          .insert(dietarySettings)
          .values({
            userId: session.user!.id,
            waterGoal: 2000,
            calorieGoal:
              session.user!.sex === 'M' ? String(2000) : String(1600),
            fatGoal:
              session.user!.sex === 'M'
                ? String(2000 * 0.2)
                : String(1600 * 0.2),
            proteinGoal:
              session.user!.sex === 'M'
                ? String(2000 * 0.2)
                : String(1600 * 0.2),
            carbsGoal:
              session.user!.sex === 'M'
                ? String(2000 * 0.6)
                : String(1600 * 0.6)
          })
          .returning()
        return res.json({ error: false, data: dietarySettingsData[0] })
      }
      const age =
        new Date().getFullYear() -
        new Date(session.user!.dateOfBirth).getFullYear()
      const bmr =
        session.user!.sex === 'M'
          ? 10 * parseFloat(session.user!.weight) +
            6.25 * session.user!.height -
            5 * age +
            5
          : 10 * parseFloat(session.user!.weight) +
            6.25 * session.user!.height -
            5 * age -
            161
      const dietarySettingsData = await db
        .insert(dietarySettings)
        .values({
          userId: session.user!.id,
          waterGoal: 2000,
          calorieGoal: String(bmr),
          fatGoal: String(bmr * 0.2),
          proteinGoal: String(bmr * 0.2),
          carbsGoal: String(bmr * 0.6)
        })
        .returning()
      return res.json({ error: false, data: dietarySettingsData[0] })
    }

    return res.json({ error: false, data: dietarySettingsData })
  } catch (e) {
    return res.status(500).json({ error: true, message: e })
  }
}
const getTypeGenerator = db.query.dietarySettings.findFirst()
export type GetDietarySettingsReturn = Awaited<typeof getTypeGenerator>

export const patch = async (req: Request, res: Response) => {
  try {
    const updateDietarySettingsSchema = z
      .object({
        waterGoal: z.number().optional(),
        calorieGoal: z.number().transform(String).optional(),
        proteinGoal: z.number().transform(String).optional(),
        fatGoal: z.number().transform(String).optional(),
        carbsGoal: z.number().transform(String).optional()
      })
      .strict()
    type UpdateUserData = z.infer<typeof updateDietarySettingsSchema>
    const partialData: UpdateUserData = updateDietarySettingsSchema.parse(
      req.body
    )

    const requestToken = req.token
    if (!requestToken) {
      return res.status(401).json({ error: true, message: 'Unauthorized' })
    }
    const session = await validateSessionToken(requestToken)
    if (!session.session) {
      return res.status(401).json({ error: true, message: 'Unauthorized' })
    }

    const updatedDietarySettings = await db
      .insert(dietarySettings)
      .values({ ...partialData, userId: session.user.id })
      .onConflictDoUpdate({
        target: dietarySettings.userId,
        set: partialData
      })
      .returning()
    if (updatedDietarySettings.length < 1) {
      return res.status(404).json({ error: true, message: 'User not found' })
    }

    return res.json({ error: false, data: updatedDietarySettings })
  } catch (e) {
    return res.status(500).json({ error: true, message: e })
  }
}
const typeGenerator = db
  .insert(dietarySettings)
  .values({ userId: 'hjh' })
  .returning()
export type PatchDietarySettingsReturn = Awaited<typeof typeGenerator>
