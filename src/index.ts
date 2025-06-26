import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Twilio } from "twilio";
import { getLatestPost } from "./scraper";

dotenv.config();

const authDir = path.resolve(__dirname, "../auth");

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

const twilio = new Twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);

const trackedUsers = ["h47172776"];
const seenPosts: Record<string, string> = {};

async function checkPosts() {
  for (const user of trackedUsers) {
    const post = await getLatestPost(user);

    if (post && post.url !== seenPosts[user]) {
      seenPosts[user] = post.url;
      const msg = `🐦 @${user} Posted:\n\n${post.text}\n\n🔗 ${post.url}`;

      await twilio.messages.create({
        body: msg,
        from: process.env.TWILIO_FROM!,
        to: process.env.TWILIO_TO!,
      });

      console.log(`✅ Sent post from @${user}`);
    }
  }
}

checkPosts();
setInterval(checkPosts, 30 * 1000);
