import { relations, sql } from 'drizzle-orm'
import {
  AnyPgColumn,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  UpdateDeleteAction,
  varchar
} from 'drizzle-orm/pg-core'

import { programs, userTags } from './programs'

import type { InferSelectModel } from 'drizzle-orm'
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

const defaultForiegnKeyAction: {
  onUpdate: UpdateDeleteAction
  onDelete: UpdateDeleteAction
} = {
  onUpdate: 'set null',
  onDelete: 'set null'
}
export const createTable = pgTableCreator((name) => `nc_${name}`)

export function enumToPgEnum<T extends Record<string, string | number>>(
  myEnum: T
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value: string | number) => `${value}`) as [
    T[keyof T],
    ...T[keyof T][]
  ]
}

export enum Activity_Level {
  BMR = 'bmr',
  SEDENTARY = 'sedentary',
  LIGHTLY_ACTIVE = 'lightly_active',
  MODERATELY_ACTIVE = 'moderately_active',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active',
  EXTRA_ACTIVE = 'extra_active'
}

export enum Sex {
  Male = 'M',
  Female = 'F'
}
export enum MediaType {
  Text = 'text',
  Image = 'image',
  Video = 'video'
}

export const activityLevelEnum = pgEnum(
  'nutrical_activity_level',
  enumToPgEnum(Activity_Level)
)
export const sexEnum = pgEnum('nutrical_sex', enumToPgEnum(Sex))
export const mediaTypeEnum = pgEnum(
  'nutrical_media_type',
  enumToPgEnum(MediaType)
)

export const users = createTable('user', {
  id: varchar('id', { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('email_verified', {
    mode: 'date',
    withTimezone: true
  }).default(sql`CURRENT_TIMESTAMP`),
  sex: sexEnum(),
  dateOfBirth: timestamp('date_of_birth', {
    mode: 'date',
    withTimezone: true
  }),
  height: integer('height'),
  weight: numeric('weight', { precision: 5, scale: 2 }),
  image: varchar('image', { length: 255 }),
  activityLevel: activityLevelEnum(),
  passwordHash: varchar('password_hash', { length: 255 })
})
export type User = InferSelectModel<typeof users>
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  programs: many(programs),
  sessions: many(sessions),
  userTags: many(userTags),
  dietaryLogs: many(dietaryLogs),
  dietarySettings: one(dietarySettings),
  posts: many(posts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  commentLikes: many(commentLikes),
  postShares: many(postShares)
}))

export const accounts = createTable(
  'account',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255
    }).notNull(),
    profile_info: text('profile_info'),
    refresh_token: text('refresh_token'),
    refresh_token_expires_in: integer('refresh_token_expires_in'),
    not_before: integer('not_before'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    id_token_expires_in: integer('id_token_expires_in'),
    session_state: varchar('session_state', { length: 255 })
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  })
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}))

export const sessions = createTable('session', {
  sessionToken: varchar('session_token', { length: 255 })
    .notNull()
    .primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id),
  expires: timestamp('expires', {
    mode: 'date',
    withTimezone: true
  }).notNull()
})
export type Session = InferSelectModel<typeof sessions>
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}))

export const verificationTokens = createTable(
  'verification_token',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
  })
)

export const dietaryLogs = createTable(
  'dietary_log',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, defaultForiegnKeyAction),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull(),
    date: timestamp('date', {
      mode: 'date',
      withTimezone: true
    })
      .defaultNow()
      .notNull(),
    waterInML: integer('water_in_ml'),
    calorieGoal: numeric('calorie_goal', { precision: 7, scale: 2 }),
    calorieConsumed: numeric('calorie_consumed', { precision: 7, scale: 2 }),
    calorieBurned: numeric('calorie_burned', { precision: 7, scale: 2 }),
    proteinGoal: numeric('protein_goal', { precision: 6, scale: 2 }),
    proteinConsumed: numeric('protein_consumed', { precision: 6, scale: 2 }),
    fatGoal: numeric('fat_goal', { precision: 6, scale: 2 }),
    fatConsumed: numeric('fat_consumed', { precision: 6, scale: 2 }),
    carbsGoal: numeric('carbs_goal', { precision: 6, scale: 2 }),
    carbsConsumed: numeric('carbs_consumed', { precision: 6, scale: 2 }),
    weight: numeric('weight', { precision: 5, scale: 2 }),
    height: integer('height')
  },
  (dietaryLog) => ({
    primaryKey: primaryKey({ columns: [dietaryLog.userId, dietaryLog.date] })
  })
)
export const dietaryLogsRelations = relations(dietaryLogs, ({ one }) => ({
  user: one(users, { fields: [dietaryLogs.userId], references: [users.id] })
}))

export const dietarySettings = createTable('dietary_setting', {
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, defaultForiegnKeyAction)
    .primaryKey(),
  waterGoal: integer('water_goal'),
  calorieGoal: numeric('calorie_goal', { precision: 7, scale: 2 }),
  proteinGoal: numeric('protein_goal', { precision: 6, scale: 2 }),
  fatGoal: numeric('fat_goal', { precision: 6, scale: 2 }),
  carbsGoal: numeric('carbs_goal', { precision: 6, scale: 2 })
})
export const dietarySettingsRelations = relations(
  dietarySettings,
  ({ one }) => ({
    user: one(users, {
      fields: [dietarySettings.userId],
      references: [users.id]
    })
  })
)

// Social Media Schema
export const posts = createTable('post', {
  id: varchar('id', { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  content: text('content').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  mediaType: mediaTypeEnum().notNull(),
  mediaUrl: varchar('media_url', { length: 255 }),
  isApproved: boolean('is_approved').default(false).notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true
  })
    .defaultNow()
    .notNull()
})

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(postComments),
  likes: many(postLikes),
  shares: many(postShares)
}))

export const postLikes = createTable(
  'post_like',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    postId: varchar('post_id', { length: 255 })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (like) => ({
    compoundKey: primaryKey({ columns: [like.userId, like.postId] })
  })
)

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] })
}))

export const postComments = createTable('post_comment', {
  id: varchar('id', { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  postId: varchar('post_id', { length: 255 })
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  parentId: varchar('parent_id', { length: 255 }).references(
    (): AnyPgColumn => postComments.id,
    { onDelete: 'cascade', onUpdate: 'cascade' }
  ),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    withTimezone: true
  })
    .defaultNow()
    .notNull()
})

export const postCommentsRelations = relations(
  postComments,
  ({ one, many }) => ({
    user: one(users, { fields: [postComments.userId], references: [users.id] }),
    post: one(posts, { fields: [postComments.postId], references: [posts.id] }),
    parent: one(postComments, {
      fields: [postComments.parentId],
      references: [postComments.id],
      relationName: 'parent_comment'
    }),
    replies: many(postComments, {
      relationName: 'parent_comment'
    }),
    likes: many(commentLikes)
  })
)

export const commentLikes = createTable(
  'comment_like',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    commentId: varchar('comment_id', { length: 255 })
      .notNull()
      .references(() => postComments.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade'
      }),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (like) => ({
    compoundKey: primaryKey({ columns: [like.userId, like.commentId] })
  })
)

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  user: one(users, { fields: [commentLikes.userId], references: [users.id] }),
  comment: one(postComments, {
    fields: [commentLikes.commentId],
    references: [postComments.id]
  })
}))

export const postShares = createTable(
  'post_share',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    postId: varchar('post_id', { length: 255 })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .defaultNow()
      .notNull()
  },
  (share) => ({
    compoundKey: primaryKey({ columns: [share.userId, share.postId] })
  })
)

export const postSharesRelations = relations(postShares, ({ one }) => ({
  user: one(users, { fields: [postShares.userId], references: [users.id] }),
  post: one(posts, { fields: [postShares.postId], references: [posts.id] })
}))
