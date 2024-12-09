import fs from "fs-extra";
import ora from "ora";
import path from "path";
import puppeteer from "puppeteer";
// import getThemes from "../themes.json" assert { type: "json" };

const spinner = ora("Loading");
const imagesFolder = path.join(process.cwd(), "/themes");

// fetch themes
const getThemes = await fetch("https://statichunt.com/data/themes.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const themes = await getThemes?.map((data) => ({
  demo: data.frontmatter.demo,
  slug: data.slug,
}));

async function captureScreenshot(demo, slug, overwrite) {
  const thumbnail = `${slug}.png`;
  const imagePath = path.join(imagesFolder, thumbnail);
  if (!overwrite && fs.existsSync(imagePath)) {
    return false;
  }

  try {
    const browser = await puppeteer.launch({
      args: [],
      headless: "new",
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
          : process.platform === "linux"
          ? "/usr/bin/google-chrome-stable"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });

    spinner.text = `${demo} => capturing`;
    const page = await browser.newPage();
    await page.setViewport({
      width: 1500,
      height: 1000,
    });

    await page.goto(demo, {
      waitUntil: "networkidle0",
      timeout: 60000, // 60 seconds timeout for loading
    });

    // Wait for animations or elements to load
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Remove cookie banner
    const cookieBox = "[class*='cookie']";
    await page.evaluate(
      (cookieBox) =>
        document.querySelectorAll(cookieBox).forEach((el) => el.remove()),
      cookieBox
    );

    await page.screenshot({ path: imagePath });
    await browser.close();
  } catch (error) {
    spinner.text = `${demo} => failed capturing`;
    console.error(error);

    return false;
  }
}

const generateScreenshots = async (themes, overwrite) => {
  spinner.start("Capturing Screenshots");
  for (const data of themes) {
    await captureScreenshot(data.demo, data.slug, overwrite);
  }
  spinner.succeed("Success - Capturing Screenshots");
};

generateScreenshots(
  themes,
  false // overwrite value
);
