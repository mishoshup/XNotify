import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const authDir = path.resolve(__dirname, "../auth");
const sessionCount = 3;

async function loginSession(index: number) {
  const storagePath = path.join(authDir, `X${index + 1}.json`);
  const browser = await chromium.launch({ headless: false }); // show browser for manual login
  const context = await browser.newContext();

  const page = await context.newPage();
  await page.goto("https://x.com/login");

  console.log(
    `🔑 [${index + 1}] Please log in manually to account #${index + 1}...`
  );
  await page.waitForTimeout(60000); // wait 1 minute to log in

  console.log(
    `💾 [${index + 1}] Saving session to X${index + 1}.json...`
  );
  await context.storageState({ path: storagePath });

  await browser.close();
}

async function main() {
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);

  for (let i = 0; i < sessionCount; i++) {
    await loginSession(i);
  }

  console.log("✅ All sessions saved.");
}

main();
