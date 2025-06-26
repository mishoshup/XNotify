// src/auth.ts
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const authDir = path.resolve(__dirname, "../auth");

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
  console.warn("⚠️ /auth directory didn't exist, created it.");
}

function restoreAuthFile(name: string, envVar: string) {
  const base64 = process.env[envVar];
  if (!base64) {
    console.warn(`⚠️ Missing environment variable: ${envVar}`);
    return;
  }

  const buffer = Buffer.from(base64, "base64");
  const filePath = path.join(authDir, name);

  try {
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Restored session: ${name}`);
  } catch (err) {
    console.error(`❌ Failed to write ${name}:`, err);
  }
}

restoreAuthFile("X1.json", "TWITTER1_JSON_B64");
restoreAuthFile("X2.json", "TWITTER2_JSON_B64");
restoreAuthFile("X3.json", "TWITTER3_JSON_B64");
