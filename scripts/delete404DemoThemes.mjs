import fsPromises from "fs/promises";
import ora from "ora";
import path from "path";
import { createWorker } from "tesseract.js";
import { fileURLToPath } from "url";

// === Configurations & Constants ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesFolder = path.resolve(__dirname, "../themes");
const crawlerLogPath = path.resolve(__dirname, "../crawler-log.json");
const deleteLogPath = path.resolve(__dirname, "../delete-log.json");
const spinner = ora("Loading");

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
  "404 Error",
  "There's nothing here",
];

// === Helper Functions ===
async function ensureFileExists(filePath) {
  try {
    await fsPromises.access(filePath);
  } catch {
    await fsPromises.writeFile(filePath, JSON.stringify([]), "utf8");
  }
}

async function readJsonFile(filePath) {
  try {
    const content = await fsPromises.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeJsonFile(filePath, data) {
  await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// === Worker Pool Helper Function ===
async function getWorker(pool) {
  while (pool.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return pool.shift();
}

// === Worker Pool Functions ===
async function createWorkerPool(poolSize) {
  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    pool.push(await createWorker());
  }
  return pool;
}

// === Image Processing Function ===
async function processFileWithPool(file, pool, crawlerLog, deleteLog) {
  const worker = await getWorker(pool);
  const imagePath = path.join(imagesFolder, file);
  try {
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    if (textsToDelete.some((phrase) => text.includes(phrase))) {
      await fsPromises.unlink(imagePath);
      deleteLog.push(file);
      console.log(` Delete: ${file}`);
    } else {
      console.log(` Keep: ${file}`);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  } finally {
    crawlerLog.push(file);
    pool.push(worker);
  }
}

// === Batch Processing Function ===
async function processImages() {
  await ensureFileExists(crawlerLogPath);
  await ensureFileExists(deleteLogPath);
  spinner.start("Checking Images");

  let files = await fsPromises.readdir(imagesFolder);
  const crawlerLog = await readJsonFile(crawlerLogPath);
  const deleteLog = await readJsonFile(deleteLogPath);
  files = files.filter((file) => !crawlerLog.includes(file));

  // Set pool size. Adjust poolSize based on your machine's capacity.
  const poolSize = Math.min(4, files.length);
  const workerPool = await createWorkerPool(poolSize);

  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    spinner.text = `Processing batch ${Math.floor(i / batchSize) + 1}`;
    await Promise.all(
      batch.map((file) =>
        processFileWithPool(file, workerPool, crawlerLog, deleteLog)
      )
    );
    // Flush logs once per batch to reduce IO overhead
    await Promise.all([
      writeJsonFile(crawlerLogPath, crawlerLog),
      writeJsonFile(deleteLogPath, deleteLog),
    ]);
  }
  spinner.succeed("Success - Images Checked");

  // Terminate all workers in the pool
  await Promise.all(workerPool.map((worker) => worker.terminate()));
}

// === Main Execution ===
async function main() {
  await processImages();
}

main().catch((err) => {
  console.error("Unexpected error:", err);
});
