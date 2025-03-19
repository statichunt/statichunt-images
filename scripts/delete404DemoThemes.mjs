import fsPromises from "fs/promises";
import ora from "ora";
import { createWorker } from "tesseract.js";
const spinner = ora("Loading");

const imagesFolder = "./themes";
const crawlerLogPath = "./crawler-log.json";
const deleteLogPath = "./delete-log.json";
const textsToDelete = [
  "The page you're looking for doesn't",
  "This page is no longer available",
  "This page isn't working",
  "There isn't a GitHub Pages site here",
  "DEPLOYMENT_NOT_FOUND",
  "Site not found",
  "Page Not Found",
  "Windows and installation",
  "Blocked due to security reason",
  "Carbon Emission Verification",
  "Advertise on Steaming Tv",
  "There isn't a GitHub Pages site here.",
  "The requested URL was not found on this server.",
  "The domain has expired",
  "Related searches",
];

// Ensure log files exist
async function ensureFileExists(filePath) {
  try {
    await fsPromises.access(filePath);
  } catch {
    await fsPromises.writeFile(filePath, JSON.stringify([]), "utf8");
  }
}

// Read JSON from a file
async function readJsonFile(filePath) {
  try {
    const content = await fsPromises.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

// Write JSON to a file
async function writeJsonFile(filePath, data) {
  await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// Process images in batches
async function processImages() {
  await ensureFileExists(crawlerLogPath);
  await ensureFileExists(deleteLogPath);

  spinner.start("Checking Images");
  let files = await fsPromises.readdir(imagesFolder);

  // Filter out already processed files
  const crawlerLog = await readJsonFile(crawlerLogPath);
  files = files.filter((file) => !crawlerLog.includes(file));

  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    spinner.text = `Processing batch ${Math.floor(i / batchSize) + 1}`;

    await Promise.all(
      batch.map(async (file) => {
        const imagePath = `${imagesFolder}/${file}`;
        try {
          const worker = await createWorker();

          const {
            data: { text },
          } = await worker.recognize(imagePath);

          await worker.terminate();

          // Check if text matches deletion criteria
          if (textsToDelete.some((phrase) => text.includes(phrase))) {
            await fsPromises.unlink(imagePath);

            // Update delete log
            const deleteLog = await readJsonFile(deleteLogPath);
            deleteLog.push(file);
            await writeJsonFile(deleteLogPath, deleteLog);

            console.log(` Delete: ${file}`);
          } else {
            console.log(` Keep: ${file}`);
          }

          // Update crawler log
          crawlerLog.push(file);
          await writeJsonFile(crawlerLogPath, crawlerLog);
        } catch (err) {
          console.error(`Error processing ${file}:`, err);
        }
      })
    );
  }

  spinner.succeed("Success - Images Checked");
}

// Start processing after a delay
setTimeout(() => {
  processImages().catch((err) => {
    console.error("Error processing images:", err);
  });
}, 1000);
