import { getDb } from "../api/queries/connection";
import { users } from "./schema";

async function seed() {
  const db = await getDb();
  console.log("Seeding database...");

  await db.insert(users).values([
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" },
  ]);

  console.log("Seed complete.");
}

seed().catch(console.error);
