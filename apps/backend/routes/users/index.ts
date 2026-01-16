import { eq } from 'drizzle-orm'
import { z } from 'zod'

import type { Request, Response } from 'express'

import { db } from '@/db/index'
import { Activity_Level, Sex, users } from '@/db/schema/user'
import { validateSessionToken } from '@/utils/auth/utils'
import { validateData } from '@/utils/zod-validate'

export const patch = async (req: Request, res: Response) => {
  try {
    const updateUserSchema = z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        sex: z.enum(['M', 'F']).optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        activityLevel: z
          .enum([
            'sedentary',
            'lightly_active',
            'moderately_active',
            'very_active'
          ])
          .optional(),
        dateOfBirth: z.coerce.date().optional(),
        email: z.string().email().optional(),
        image: z.string().optional(),
        updatedAt: z.coerce.date().optional()
      })
      .strict()
    type UpdateUserData = z.infer<typeof updateUserSchema>
    const partialData: UpdateUserData = updateUserSchema.parse(req.body)
    const valid = validateData(updateUserSchema, partialData)
    if (valid !== 'OK') {
      return res.status(400).json({ error: true, message: valid })
    }

    const requestToken = req.token
    const session = await validateSessionToken(requestToken)
    if (!session) {
      return res.status(401).json({ error: true, message: 'Unauthorized' })
    }
    partialData.updatedAt = new Date()

    // Map 'sex' to the correct type if necessary
    const dbUpdateData = {
      ...partialData,
      sex: partialData.sex as Sex,
      activityLevel: partialData.activityLevel as Activity_Level,
      weight: partialData.weight?.toString()
    }

    const updatedUser = await db
      .update(users)
      .set(dbUpdateData)
      .where(eq(users.id, session.session.userId))
      .returning()

    if (updatedUser.length < 1) {
      return res.status(404).json({ error: true, message: 'User not found' })
    }
    updatedUser[0]!.passwordHash = ''

    return res.json({ error: false, data: updatedUser })
  } catch (e) {
    return res.status(500).json({ error: true, message: e.message })
  }
}
const updatedUser = db.update(users).set({ id: '123' }).returning()
export type PatchUserReturn = Awaited<typeof updatedUser>
