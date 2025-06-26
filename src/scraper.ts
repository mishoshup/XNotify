import fs from "fs";
import path from "path";
import { chromium as baseChromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";

baseChromium.use(stealth());

const authDir = path.resolve(__dirname, "../auth");
const storagePaths = fs
  .readdirSync(authDir)
  .filter((file) => file.startsWith("twitter") && file.endsWith(".json"))
  .map((file) => path.join(authDir, file));

export async function getLatestPost(
  username: string
): Promise<{ text: string; url: string } | null> {
  for (const storagePath of storagePaths) {
    const browser = await baseChromium.launch({ headless: true });
    const context = await browser.newContext({
      storageState: fs.existsSync(storagePath) ? storagePath : undefined,
    });
    const page = await context.newPage();

    try {
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

          await browser.close();

          if (text && link) {
            return {
              text,
              url: `https://x.com${link}`,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn(
        `❌ Failed with ${path.basename(storagePath)}:`,
        err.message
      );
    } finally {
      await browser.close();
    }
  }

  console.error(`❌ All sessions failed for @${username}`);
  return null;
}
