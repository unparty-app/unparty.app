# Database Setup

The step-by-step guide lives in the **[CREATE YOUR DATABASE.](/article/setup-database)** article (source: `src/app/constants/editorial-articles/articles/setup-database.ts`). It walks through creating a Neon project, picking a plan, copying both connection strings, and running the first push and seed. Start there.

This page is the quick reference that sits next to it.

---

## The two connection strings

The schema (`prisma/schema.prisma`) is PostgreSQL only. SQLite will not work.

Both keys go in `.env` in the project root. The site, the Prisma CLI and the seed scripts all read `.env`; Prisma never reads `.env.local`. Git ignores `.env`, so never commit it.

```bash
# .env
DATABASE_URL="postgresql://…@ep-your-project-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_DATABASE_URL="postgresql://…@ep-your-project.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

- `DATABASE_URL` is the **pooled** string (its host contains `-pooler`). The running site uses it.
- `DIRECT_DATABASE_URL` is the same string **without** `-pooler`. Prisma migrations use it.

On Vercel, set both under **Settings → Environment Variables** for every environment, then redeploy.

---

## Common commands

```bash
npm run db:generate     # Generate the Prisma client
npm run db:push         # Sync the schema to the database (no migration history)
npm run db:migrate      # Create and apply a migration (prisma migrate dev)
npm run db:studio       # Open Prisma Studio
npm run db:seed:setup   # Upsert the SETUP. curriculum (safe to re-run)
```

`npm run db:seed` **deletes all steps, categories and user progress** before seeding. Never run it against a live database.

---

## Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Check that `.env` (not `.env.local`) exists in the project root and contains `DATABASE_URL`.
- Restart `npm run dev`.
- On Vercel, check that the variable is set for the environment you deployed, then redeploy.

### "Can't reach database server"
- Check the format: `postgresql://username:password@host:port/database?sslmode=require`.
- Neon suspends idle databases on the Free plan. The first connection after a pause can be slow; try again.
- Check the provider's status page.

### "SSL connection required"
Add `?sslmode=require` to the end of both strings.

### "Password authentication failed"
- Copy the string again from the provider's dashboard.
- URL-encode special characters in the password: `@` → `%40`, `#` → `%23`, `$` → `%24`.

### "Migration failed" or the schema is out of sync
- Check that `DIRECT_DATABASE_URL` is set and does **not** contain `-pooler`.
- Run `npm run db:push` to sync the schema, or `npm run db:migrate` to create and apply a migration.

---

## Learn more
- [Prisma documentation](https://www.prisma.io/docs)
- [Neon documentation](https://neon.com/docs)
