import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * TaskFlow — configuration Prisma 7.
 * L'URL de migration est lue depuis DATABASE_URL (.env), typée et validée.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
