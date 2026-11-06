import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

const SEED_TODOS = [
  {
    title: "Read the Sentry walkthrough",
    notes: "SENTRY.md in the project root explains each concept in order.",
    priority: "HIGH",
    completed: false,
  },
  {
    title: "Open GraphiQL and run a query",
    notes: "http://localhost:3000/api/graphql",
    priority: "MEDIUM",
    completed: false,
  },
  {
    title: "Trigger an error from the Sentry demo page",
    notes: "/sentry-demo has one button per failure mode.",
    priority: "MEDIUM",
    completed: false,
  },
  {
    title: "Swap a design token and watch the UI change",
    notes: "src/styles/tokens.css is the only place colours are defined.",
    priority: "LOW",
    completed: false,
  },
  {
    title: "Install the dependencies",
    notes: null,
    priority: "LOW",
    completed: true,
  },
];

async function main() {
  await prisma.todo.deleteMany();
  await prisma.todo.createMany({ data: SEED_TODOS });

  const count = await prisma.todo.count();
  console.log(`Seeded ${count} todos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
