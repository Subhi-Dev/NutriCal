import { relations } from 'drizzle-orm'
import {
  integer,
  numeric,
  pgEnum,
  pgTableCreator,
  serial,
  text,
  timestamp,
  UpdateDeleteAction,
  varchar,
  boolean
} from 'drizzle-orm/pg-core'

import { users } from './user'

import type { InferSelectModel } from 'drizzle-orm'
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `nc_${name}`)

export function enumToPgEnum<T extends Record<string, string | number>>(
  myEnum: T
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value: string | number) => `${value}`) as [
    T[keyof T],
    ...T[keyof T][]
  ]
}

export enum Meal {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  FUNCTIONAL_FOOD = 'functional_food'
}

export const mealEnum = pgEnum('meal', enumToPgEnum(Meal))

export enum FoodType {
  RECIPE = 'recipe',
  COMPONENT = 'component'
}
export const foodTypeEnum = pgEnum('food_type', enumToPgEnum(FoodType))

const defaultForiegnKeyAction: {
  onUpdate: UpdateDeleteAction
  onDelete: UpdateDeleteAction
} = {
  onUpdate: 'set null',
  onDelete: 'set null'
}
export const programTemplates = createTable('program_template', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  featuredImageUrl: varchar('featured_image_url', { length: 255 }),
  cardImageUrl: varchar('card_image_url', { length: 255 }),
  detailImageUrl: varchar('detail_image_url', { length: 255 }),
  shortDescription: varchar('short_description', { length: 255 }),
  startColor: varchar('start_color', { length: 7 }),
  endColor: varchar('end_color', { length: 7 }),
  contentColor: varchar('content_color', { length: 7 }),
  accentColor: varchar('accent_color', { length: 7 }),
  isFeatured: boolean('is_featured').default(false),
  warningText: text('warning_text'),
  description: text('description'),
  durationInDays: integer('duration_in_days').notNull(),
  instructions: text('instructions'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export type ProgramTemplate = InferSelectModel<typeof programTemplates>
export const programTemplateRelations = relations(
  programTemplates,
  ({ many }) => ({
    programTemplateFoods: many(programTemplateFoods),
    programs: many(programs),
    programTemplateTags: many(programTemplateTags)
  })
)

// Pivot table for many-to-many (program template <-> food)
export const programTemplateFoods = createTable('program_template_food', {
  id: serial('id').primaryKey(),
  programTemplateId: integer('program_template_id').references(
    () => programTemplates.id,
    defaultForiegnKeyAction
  ),
  dayIndex: integer('day_index').notNull(),
  mealName: mealEnum(),
  foodId: integer('food_id').references(() => food.id, defaultForiegnKeyAction),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  unitId: integer('unit_id').references(
    () => foodUnits.id,
    defaultForiegnKeyAction
  ),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const programTemplateFoodsRelations = relations(
  programTemplateFoods,
  ({ one }) => ({
    programTemplate: one(programTemplates, {
      fields: [programTemplateFoods.programTemplateId],
      references: [programTemplates.id]
    }),
    food: one(food, {
      fields: [programTemplateFoods.foodId],
      references: [food.id]
    }),
    unit: one(foodUnits, {
      fields: [programTemplateFoods.unitId],
      references: [foodUnits.id]
    })
  })
)

export const programs = createTable('program', {
  id: serial('id').primaryKey(),
  programTemplateId: integer('program_template_id').references(
    () => programTemplates.id,
    defaultForiegnKeyAction
  ),
  userId: varchar('user_id', { length: 255 }).references(
    () => users.id,
    defaultForiegnKeyAction
  ),
  name: varchar('name', { length: 255 }).notNull(),
  instructions: text('instructions'),
  isSelected: boolean('is_selected').default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  startDate: timestamp('start_date', {
    mode: 'date',
    withTimezone: true
  }).notNull(),
  endDate: timestamp('end_date', { mode: 'date', withTimezone: true })
})
export type Program = InferSelectModel<typeof programs>
export const programsRelations = relations(programs, ({ one, many }) => ({
  programTemplate: one(programTemplates, {
    fields: [programs.programTemplateId],
    references: [programTemplates.id]
  }),
  user: one(users, { fields: [programs.userId], references: [users.id] }),
  programTags: many(programTags),
  programFoods: many(programFoods)
}))

// Pivot table for many-to-many (program <-> food)
export const programFoods = createTable('program_food', {
  id: serial('id').primaryKey(),
  programId: integer('program_id').references(
    () => programs.id,
    defaultForiegnKeyAction
  ),
  dayIndex: integer('day_index').notNull(),
  mealName: mealEnum(),
  foodId: integer('food_id').references(() => food.id, defaultForiegnKeyAction),
  amount: numeric('amount', { precision: 10, scale: 2 }),
  unitId: integer('unit_id').references(
    () => foodUnits.id,
    defaultForiegnKeyAction
  ),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const programFoodsRelations = relations(programFoods, ({ one }) => ({
  program: one(programs, {
    fields: [programFoods.programId],
    references: [programs.id]
  }),
  food: one(food, {
    fields: [programFoods.foodId],
    references: [food.id]
  }),
  unit: one(foodUnits, {
    fields: [programFoods.unitId],
    references: [foodUnits.id]
  })
}))

export const food = createTable('food', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: foodTypeEnum('type').notNull(),
  categoryId: integer('category_id').references(
    () => foodCategories.id,
    defaultForiegnKeyAction
  ),
  // Recipe fields
  notes: text('notes'),
  backgroundImageUrl: varchar('background_image_url', { length: 255 }),
  photoUrl: varchar('photo_url', { length: 255 }),
  barcode: varchar('barcode', { length: 255 }),
  cookingTime: integer('cooking_time'),
  servings: integer('servings'),
  // Component fields
  sourceReferenceId: integer('source_reference_id').unique(),
  sourceId: integer('source_id').references(
    () => sources.id,
    defaultForiegnKeyAction
  ),
  calories: numeric('calories', { precision: 6, scale: 2 }),
  carbohydrates: numeric('carbohydrates', { precision: 6, scale: 2 }),
  simpleSugars: numeric('simple_sugars', { precision: 6, scale: 2 }),
  fiber: numeric('fiber', { precision: 6, scale: 2 }),
  fats: numeric('fats', { precision: 6, scale: 2 }),
  proteins: numeric('proteins', { precision: 6, scale: 2 }),
  potassium: numeric('potassium', { precision: 6, scale: 2 }),
  sodium: numeric('sodium', { precision: 6, scale: 2 }),
  saturatedFats: numeric('saturated_fats', { precision: 6, scale: 2 }),
  unsaturatedFats: numeric('unsaturated_fats', { precision: 6, scale: 2 }),
  cholesterol: numeric('cholesterol', { precision: 6, scale: 2 }),
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export type Food = InferSelectModel<typeof food>
export const foodRelations = relations(food, ({ many, one }) => ({
  category: one(foodCategories, {
    fields: [food.categoryId],
    references: [foodCategories.id]
  }),
  programTemplateFoods: many(programTemplateFoods),
  programFoods: many(programFoods),
  foodTags: many(foodTags),
  // as recipe
  recipeFoodComponents: many(foodComponents, { relationName: 'recipe' }),
  recipeSteps: many(recipeSteps),
  recipeIngredients: many(recipeIngredients),
  // as component
  componentInRecipes: many(foodComponents, { relationName: 'component' }),
  source: one(sources, {
    fields: [food.sourceId],
    references: [sources.id]
  }),
  units: many(foodUnits)
}))

// For recipe tags & program tags
export const tags = createTable('tag', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const tagsRelations = relations(tags, ({ many }) => ({
  programTags: many(programTags),
  programTemplateTags: many(programTemplateTags),
  foodTags: many(foodTags),
  userTags: many(userTags)
}))

export const programTemplateTags = createTable('program_template_tag', {
  programTemplateId: integer('program_template_id')
    .references(() => programTemplates.id, defaultForiegnKeyAction)
    .notNull(),
  tagId: integer('tag_id')
    .references(() => tags.id, defaultForiegnKeyAction)
    .notNull()
})
export const programTemplateTagsRelations = relations(
  programTemplateTags,
  ({ one }) => ({
    programTemplate: one(programTemplates, {
      fields: [programTemplateTags.programTemplateId],
      references: [programTemplates.id]
    }),
    tag: one(tags, {
      fields: [programTemplateTags.tagId],
      references: [tags.id]
    })
  })
)

export const programTags = createTable('program_tag', {
  programId: integer('program_id')
    .references(() => programs.id, defaultForiegnKeyAction)
    .notNull(),
  tagId: integer('tag_id')
    .references(() => tags.id, defaultForiegnKeyAction)
    .notNull()
})
export const programTagsRelations = relations(programTags, ({ one }) => ({
  program: one(programs, {
    fields: [programTags.programId],
    references: [programs.id]
  }),
  tag: one(tags, {
    fields: [programTags.tagId],
    references: [tags.id]
  })
}))

export const foodTags = createTable('food_tag', {
  foodId: integer('food_id')
    .references(() => food.id, defaultForiegnKeyAction)
    .notNull(),
  tagId: integer('tag_id')
    .references(() => tags.id, defaultForiegnKeyAction)
    .notNull()
})
export const foodTagsRelations = relations(foodTags, ({ one }) => ({
  food: one(food, {
    fields: [foodTags.foodId],
    references: [food.id]
  }),
  tag: one(tags, {
    fields: [foodTags.tagId],
    references: [tags.id]
  })
}))

export const userTags = createTable('user_tag', {
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => users.id, defaultForiegnKeyAction),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id, defaultForiegnKeyAction)
})

export const userTagsRelations = relations(userTags, ({ one }) => ({
  user: one(users, {
    fields: [userTags.userId],
    references: [users.id]
  }),
  tag: one(tags, {
    fields: [userTags.tagId],
    references: [tags.id]
  })
}))

export const foodCategories = createTable('food_category', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const foodCategoriesRelations = relations(
  foodCategories,
  ({ many }) => ({
    foods: many(food)
  })
)

export const foodUnits = createTable('food_unit', {
  id: serial('id').primaryKey(),
  foodId: integer('food_id')
    .references(() => food.id, { onDelete: 'cascade', onUpdate: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  gramsEquivalent: numeric('grams_equivalent', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const foodUnitsRelations = relations(foodUnits, ({ one }) => ({
  food: one(food, {
    fields: [foodUnits.foodId],
    references: [food.id]
  })
}))

// Pivot table for many-to-many (food (recipe) <-> food (component))
export const foodComponents = createTable('food_component', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id')
    .references(() => food.id, defaultForiegnKeyAction)
    .notNull(),
  componentId: integer('component_id').references(
    () => food.id,
    defaultForiegnKeyAction
  ),
  weightInGrams: numeric('weight_in_grams', { precision: 6, scale: 1 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const foodComponentsRelations = relations(foodComponents, ({ one }) => ({
  recipe: one(food, {
    fields: [foodComponents.recipeId],
    references: [food.id],
    relationName: 'recipe'
  }),
  component: one(food, {
    fields: [foodComponents.componentId],
    references: [food.id],
    relationName: 'component'
  })
}))

export const recipeSteps = createTable('recipe_step', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id')
    .references(() => food.id, defaultForiegnKeyAction)
    .notNull(),
  stepText: text('step_text').notNull(),
  stepOrder: integer('step_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(food, {
    fields: [recipeSteps.recipeId],
    references: [food.id]
  })
}))

export const recipeIngredients = createTable('recipe_ingredient', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id')
    .references(() => food.id, defaultForiegnKeyAction)
    .notNull(),
  ingredientText: text('ingredient_text').notNull(),
  ingredientOrder: integer('ingredient_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(food, {
      fields: [recipeIngredients.recipeId],
      references: [food.id]
    })
  })
)

export const sources = createTable('source', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  logoImageUrl: varchar('logo_image_url', { length: 255 }),
  websiteUrl: varchar('website_url', { length: 255 }),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})
export const sourcesRelations = relations(sources, ({ many }) => ({
  foods: many(food)
}))
