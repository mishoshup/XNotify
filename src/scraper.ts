import "./auth";

import fs from "fs";
import path from "path";
import { chromium as baseChromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

baseChromium.use(stealth());

const authDir = path.resolve(__dirname, "../auth");

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
  const availableStoragePaths = fs
    .readdirSync(authDir)
    .filter((file) => file.startsWith("X") && file.endsWith(".json"))
    .map((file) => path.join(authDir, file));

  const shuffledStoragePaths = shuffleArray([...availableStoragePaths]);

  for (const storagePath of shuffledStoragePaths) {
    let browser = null;
    try {
      console.log(`🔍 Trying ${path.basename(storagePath)} for @${username}`);
      browser = await baseChromium.launch({ headless: true });
      const context = await browser.newContext({
        storageState: fs.existsSync(storagePath) ? storagePath : undefined,
      });
      const page = await context.newPage();

      await page.goto(`https://x.com/${username}`, { timeout: 20000 });
      await page.waitForSelector("article", { timeout: 20000 });

      const articles = await page.locator("article").all();

      for (const article of articles) {
        const articleText = await article.innerText();
        if (!articleText.includes("Pinned")) {
          const text = await article.locator("div[lang]").innerText();
          const linkElement = article.locator('a[href*="/status/"]').last();
          if ((await linkElement.count()) > 0) {
            const link = await linkElement.getAttribute("href");
            if (text && link) {
              console.log(`✅ Post found from @${username}`);
              await browser.close();
              return { text, url: `https://x.com${link}` };
            }
          }
        }
      }

      console.log(`🟡 No non-pinned post from ${path.basename(storagePath)}`);
    } catch (err: any) {
      console.warn(
        `❌ Failed with ${path.basename(storagePath)}:`,
        err.message
      );
    } finally {
      if (browser && browser.isConnected()) {
        try {
          await browser.close();
        } catch (e) {
          console.warn("⚠️ Failed to close browser:", (e as Error).message);
        }
      }
    }
  }

  return null;
}
