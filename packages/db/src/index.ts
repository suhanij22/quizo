import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

dotenv.config({
  path: path.resolve(currentDir, "../../.env"),
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from packages/db/.env");
}

const adapter = new PrismaPg({ connectionString });

export const prismaClient = new PrismaClient({ adapter });