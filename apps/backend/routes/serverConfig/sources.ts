import { inArray } from 'drizzle-orm'
import { z } from 'zod'

import type { Request, Response } from 'express'

import { db } from '@/db/index'
import { sources } from '@/db/schema/programs'
import { validateSessionToken } from '@/utils/auth/utils'
import { validateData } from '@/utils/zod-validate'

export const get = async (req: Request, res: Response) => {
  try {
    const requestToken = req.token
    const session = await validateSessionToken(requestToken)
    if (!session.session) {
      return res.status(401).json({ error: true, message: 'Unauthorized' })
    }

    const serverSourcesData = await db.select().from(sources)
    return res.json({ error: false, data: serverSourcesData })
  } catch (e) {
    return res.status(500).json({ error: true, message: e.message })
  }
}
const getServerSources = db.select().from(sources)
export type GetServerSources = Awaited<typeof getServerSources>

export const put = async (req: Request, res: Response) => {
  try {
    const updateServerSourcesSchema = z
      .object({ ids: z.array(z.number().int()) })
      .strict()

    const partialData: z.infer<typeof updateServerSourcesSchema> =
      updateServerSourcesSchema.parse(req.body)
    console.log('Partial Data:', partialData)

    const valid = validateData(updateServerSourcesSchema, partialData)
    if (valid !== 'OK') {
      return res.status(400).json({ error: true, message: valid })
    }

    const requestToken = req.token
    const session = await validateSessionToken(requestToken)
    if (!session.session) {
      return res.status(401).json({ error: true, message: 'Unauthorized' })
    }
    if (partialData.ids.length === 0) {
      await db.update(sources).set({ enabled: false })
      return res.json({ error: false, data: [] })
    } else {
      const updatedServerConfig = await db
        .update(sources)
        .set({ enabled: true })
        .where(inArray(sources.id, partialData.ids))
        .returning()
      return res.json({ error: false, data: updatedServerConfig })
    }
  } catch (e) {
    return res.status(500).json({ error: true, message: e.message })
  }
}
const PutServerSourceConfig = db
  .update(sources)
  .set({ enabled: true })
  .returning()
export type PutServerSourceConfig = Awaited<typeof PutServerSourceConfig>
