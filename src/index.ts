import "./auth";

import { Twilio } from "twilio";
import { getLatestPost } from "./scraper";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const twilio = new Twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);
const trackedUsers = ["livenationsg", "h47172776"];

const seenFile = path.resolve(__dirname, "../seenPosts.json");
let seenPosts: Record<string, string> = {};

// Load seen posts from file
try {
  if (fs.existsSync(seenFile)) {
    seenPosts = JSON.parse(fs.readFileSync(seenFile, "utf-8"));
  }
} catch (e) {
  console.warn("⚠️ Failed to load seenPosts.json");
}

// Retry wrapper
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 5000
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    console.warn(`⚠️ Retry due to error: ${(err as Error).message}`);
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// Debounced loop
async function checkAndSchedule() {
  for (const user of trackedUsers) {
    try {
      const post = await retry(() => getLatestPost(user));
      if (post && post.url !== seenPosts[user]) {
        seenPosts[user] = post.url;

        const msg = `@${user} Posted:\n\n${post.text}\n\n🔗 ${post.url}`;
        await twilio.messages.create({
          body: msg,
          from: process.env.TWILIO_FROM!,
          to: process.env.TWILIO_TO!,
        });

        console.log(`📤 Sent alert for @${user}`);
        fs.writeFileSync(seenFile, JSON.stringify(seenPosts, null, 2));
      } else {
        console.log(`⏩ No new post for @${user}`);
      }
    } catch (err) {
      console.error(`❌ Failed to check @${user}:`, (err as Error).message);
    }
  }

  setTimeout(checkAndSchedule, 15000);
}

checkAndSchedule();
