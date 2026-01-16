import type { Response, Request } from 'express'

import { db } from '@/db/index'
import { validateSessionToken } from '@/utils/auth/utils'
export const get = async (req: Request, res: Response) => {
  try {
    const requestToken = req.token
    if (!requestToken) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }
    const session = await validateSessionToken(requestToken)
    if (session === null) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }
    const programTemplates = await db.query.programTemplates.findMany({
      orderBy: (programTemplates, { desc }) => [
        desc(programTemplates.createdAt)
      ],
      with: {
        programTemplateFoods: {
          with: {
            food: true
          }
        },
        programTemplateTags: {
          with: {
            tag: true
          }
        }
      }
    })

    return res.json({
      error: false,
      data: programTemplates
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e
    })
  }
}
const programTemplates = db.query.programTemplates.findMany({
  orderBy: (programTemplates, { desc }) => [desc(programTemplates.createdAt)],
  with: {
    programTemplateFoods: {
      with: {
        food: true
      }
    },
    programTemplateTags: {
      with: {
        tag: true
      }
    }
  }
})
export type ProgramTemplates = Awaited<typeof programTemplates>
