import { eq } from 'drizzle-orm'

import type { Response, Request } from 'express'

import { db } from '@/db/index'
import { programs } from '@/db/schema/programs'
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
    const userPrograms = await db.query.programs.findMany({
      where: eq(programs.userId, session.session.userId),
      orderBy: (programs, { desc }) => [desc(programs.createdAt)],
      with: {
        programFoods: {
          with: {
            food: {
              with: {
                recipeFoodComponents: {
                  with: {
                    component: true
                  }
                }
              }
            }
          }
        },
        programTags: {
          with: {
            tag: true
          }
        },
        programTemplate: true
      }
    })

    return res.json({
      error: false,
      data: userPrograms
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e
    })
  }
}
const userPrograms = db.query.programs.findMany({
  orderBy: (programs, { desc }) => [desc(programs.createdAt)],
  with: {
    programFoods: {
      with: {
        food: {
          with: {
            recipeFoodComponents: {
              with: {
                component: true
              }
            }
          }
        }
      }
    },
    programTags: {
      with: {
        tag: true
      }
    },
    programTemplate: true
  }
})
export type UserPrograms = Awaited<typeof userPrograms>
