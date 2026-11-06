/**
 * Pothos builds the schema in TypeScript, which makes it hard to review in a
 * pull request. This writes the equivalent SDL to schema.graphql so schema
 * changes show up as a readable diff.
 *
 *   npm run schema:print
 */
import { writeFileSync } from "node:fs";
import { printSchema, lexicographicSortSchema } from "graphql";

import { schema } from "../src/graphql/schema";

const sdl = printSchema(lexicographicSortSchema(schema));

writeFileSync("schema.graphql", `${sdl}\n`, "utf8");
console.log("Wrote schema.graphql");
