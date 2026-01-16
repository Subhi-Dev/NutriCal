import { log } from 'console'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import type { Request, Response } from 'express'

import { db } from '@/db/index'
import { MediaType, posts } from '@/db/schema/user'
import { validateSessionToken } from '@/utils/auth/utils'

export const get = async (req: Request, res: Response) => {
  try {
    const { page = '1' } = req.query
    const pageNumber = parseInt(page as string, 10)
    const requestToken = req.token
    const session = await validateSessionToken(requestToken || '')

    if (session === null) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }

    const posts = await db.query.posts.findMany({
      limit: 30,
      offset: (pageNumber - 1) * 30,
      where: (posts, { and, eq }) =>
        and(eq(posts.isApproved, true), eq(posts.isBanned, false)),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      with: {
        likes: {
          columns: {
            userId: true
          }
        },
        comments: {
          columns: {
            id: true
          }
        },
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        }
      }
    })
    return res.json({
      error: false,
      data: posts
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e
    })
  }
}
const getPosts = db.query.posts.findMany({
  limit: 30,
  where: (posts, { and, eq }) =>
    and(eq(posts.isApproved, true), eq(posts.isBanned, false)),
  orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  with: {
    likes: {
      columns: {
        userId: true
      }
    },
    comments: {
      columns: {
        id: true
      }
    },
    user: {
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        image: true
      }
    }
  }
})
export type GetPosts = Awaited<typeof getPosts>
export const post = async (req: Request, res: Response) => {
  try {
    const schema = z
      .object({
        content: z.string().min(1, 'Content is required'),
        mediaType: z
          .enum(Object.values(MediaType) as [string, ...string[]])
          .default(MediaType.Text),
        mediaUrl: z.string().url().max(255).optional()
      })
      .strict()
    const reqData = schema.parse(req.body)

    const requestToken = req.token
    const session = await validateSessionToken(requestToken || '')

    if (session === null) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }
    log('Session:', session)
    // Create a new post
    const newPost = await db
      .insert(posts)
      .values({
        userId: session.session?.userId ?? '',
        content: reqData.content,
        mediaType: reqData.mediaType as MediaType,
        mediaUrl: reqData.mediaUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        isApproved: true,
        isBanned: false
      })
      .returning()

    return res.status(201).json({
      error: false,
      data: newPost
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e
    })
  }
}
const postPosts = db
  .insert(posts)
  .values({
    userId: '',
    content: '',
    mediaType: MediaType.Text,
    mediaUrl: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    isApproved: true,
    isBanned: false
  })
  .returning()
export type PostPosts = Awaited<typeof postPosts>
export const patch = async (req: Request, res: Response) => {
  try {
    const schema = z
      .object({
        content: z.string().min(1, 'Content is required'),
        mediaType: z
          .enum(Object.values(MediaType) as [string, ...string[]])
          .default(MediaType.Text),
        mediaUrl: z.string().url().max(255).optional(),
        id: z.number().int().positive('Post ID is required')
      })
      .strict()
    const reqData = schema.parse(req.body)

    const requestToken = req.token
    const session = await validateSessionToken(requestToken || '')

    if (session === null) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }

    // Check if post exists and belongs to the user
    const existingPost = await db.query.posts.findFirst({
      where: (posts, { and, eq }) =>
        and(
          eq(posts.id, reqData.id.toString()),
          eq(posts.userId, session.user?.id ?? '')
        )
    })

    if (!existingPost) {
      return res.status(404).json({
        error: true,
        message: 'Post not found'
      })
    }

    // Update the post
    const updatedPost = await db
      .update(posts)
      .set({
        content: reqData.content,
        mediaType: reqData.mediaType as MediaType, // ensure correct type
        mediaUrl: reqData.mediaUrl,
        updatedAt: new Date(),
        isApproved: true, // or true, depending on your logic
        isBanned: false // default value
      })
      .where(eq(posts.id, existingPost.id))
      .returning()

    return res.json({
      error: false,
      data: updatedPost
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e
    })
  }
}

export const del = async (req: Request, res: Response) => {
  try {
    const schema = z
      .object({
        id: z.number().int().positive('Post ID is required')
      })
      .strict()
    const reqData = schema.parse(req.body)

    const requestToken = req.token
    const session = await validateSessionToken(requestToken || '')

    if (session === null) {
      return res.status(401).json({
        error: true,
        message: 'Unauthorized'
      })
    }

    // Check if post exists and belongs to the user
    const existingPost = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, reqData.id.toString()),
        eq(posts.userId, session.user?.id ?? '')
      )
    })

    if (!existingPost) {
      return res.status(404).json({
        error: true,
        message: 'Post not found'
      })
    }

    // Delete the post
    await db.delete(posts).where(eq(posts.id, existingPost.id)).execute()

    return res.json({
      error: false,
      message: 'Post deleted successfully'
    })
  } catch (e) {
    return res.status(500).json({
      error: true,
      message: e
    })
  }
}
