// src/scraper.ts
import "./auth";

import fs from "fs";
import path from "path";
import { chromium as baseChromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

baseChromium.use(stealth());

const authDir = path.resolve(__dirname, "../auth");

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function getLatestPost(
  username: string
): Promise<{ text: string; url: string } | null> {
  // Read and shuffle storage paths for each call
  const availableStoragePaths = fs
    .readdirSync(authDir)
    .filter((file) => file.startsWith("X") && file.endsWith(".json"))
    .map((file) => path.join(authDir, file));

  const shuffledStoragePaths = shuffleArray([...availableStoragePaths]);

  for (const storagePath of shuffledStoragePaths) {
    let browser = null; // Declare browser outside try for finally block
    try {
      browser = await baseChromium.launch({ headless: true });
      const context = await browser.newContext({
        storageState: fs.existsSync(storagePath) ? storagePath : undefined,
      });
      const page = await context.newPage();

      const url = `https://x.com/${username}`;
      await page.goto(url, { timeout: 20000 });
      await page.waitForSelector("article", { timeout: 20000 });

      const articles = await page.locator("article").all();

      for (const article of articles) {
        const isPinned = await article
          .innerText()
          .then((text) => text.includes("Pinned"));
        if (!isPinned) {
          const text = await article.locator("div[lang]").innerText();
          const link = await article
            .locator('a[href*="/status/"]')
            .last()
            .getAttribute("href");

          // IMPORTANT: Close the browser ONLY if you are returning a post.
          // Otherwise, the `finally` block will handle closing on error/no post.
          await browser.close(); 

          if (text && link) {
            console.log(`✅ Post found using ${path.basename(storagePath)} for @${username}`);
            return {
              text,
              url: `https://x.com${link}`,
            };
          }
        }
      }
      // If no suitable article was found using this session, but no error occurred
      console.log(`🟡 No new non-pinned post found using ${path.basename(storagePath)} for @${username}`);

    } catch (err: any) {
      console.warn(
        `❌ Failed to scrape with ${path.basename(storagePath)} for @${username}:`,
        err.message
      );
    } finally {
      // Ensure browser is closed even if an error occurs or no post is found
      if (browser) {
        await browser.close();
      }
    }
  }

  console.error(`❌ All tried sessions failed or found no posts for @${username}`);
  return null;
}