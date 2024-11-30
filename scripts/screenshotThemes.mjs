import fs from "fs-extra";
import ora from "ora";
import path from "path";
import puppeteer from "puppeteer";
// import getThemes from "../themes.json" assert { type: "json" };

const spinner = ora("Loading");
const imagesFolder = path.join(process.cwd(), "/themes");

// Fetch themes
const getThemes = await fetch("https://statichunt.com/data/themes.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const themes = getThemes?.map((data) => ({
  demo: data.frontmatter.demo,
  slug: data.slug,
}));

async function captureScreenshot(browser, demo, slug, overwrite, updateLog) {
  const thumbnail = `${slug}.png`;
  const imagePath = path.join(imagesFolder, thumbnail);
  if (!overwrite && fs.existsSync(imagePath)) {
    updateLog(`${slug}: Skipped`);
    return;
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1500,
      height: 1000,
    });

    const timeout = 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      await page.goto(demo, {
        waitUntil: "networkidle0",
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
      await page.close();
      updateLog(`${slug}: Timeout`);
      throw new Error("Timeout");
    }

    clearTimeout(timer);

    // Remove cookie banner
    const cookieBox = "[class*='cookie']";
    await page.evaluate(
      (cookieBox) =>
        document.querySelectorAll(cookieBox).forEach((el) => el.remove()),
      cookieBox
    );

    await page.screenshot({ path: imagePath });
    await page.close();
    updateLog(`${slug}: Captured`);
  } catch (error) {
    updateLog(`${slug}: Failed`);
    console.error(`Error capturing ${slug}:`, error);
  }
}

const generateScreenshots = async (themes, overwrite) => {
  spinner.start("Capturing Screenshots");

  // Launch browser once
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath:
      process.platform === "win32"
        ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        : process.platform === "linux"
        ? "/usr/bin/google-chrome-stable"
        : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  // Process themes in batches of 10 using shared browser
  const batchSize = 10;
  for (let i = 0; i < themes.length; i += batchSize) {
    const batch = themes.slice(i, i + batchSize);
    let logs = [];

    const updateLog = (message) => {
      logs.push(message);
      spinner.text = `Capturing Screenshots:\n${logs.join("\n")}`;
    };

    await Promise.all(
      batch.map((data) =>
        captureScreenshot(browser, data.demo, data.slug, overwrite, updateLog)
      )
    );

    logs = []; // Clear logs for the next batch
  }

  await browser.close();
  spinner.succeed("Success - Capturing Screenshots");
};

generateScreenshots(
  themes,
  false // overwrite value
);
