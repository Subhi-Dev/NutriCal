import { type Config } from 'drizzle-kit'

export default {
  schema: './db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: true
  },
  out: './drizzle',
  tablesFilter: ['nc_*'],
  verbose: true,
  strict: true
} satisfies Config
