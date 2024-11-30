import fs from "fs";
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
  "Site Not Found",
  "Windows and installation",
  "Blocked due to security reason",
];

// Check if the crawler-log file exists
fs.access(crawlerLogPath, fs.constants.F_OK, (err) => {
  if (err) {
    fs.writeFile(crawlerLogPath, JSON.stringify([]), "utf8", (err) => {
      if (err) {
        console.error("Error creating file:", err);
        return;
      }
    });
  }
});

// check if the delete log file exists
fs.access(deleteLogPath, fs.constants.F_OK, (err) => {
  if (err) {
    fs.writeFile(deleteLogPath, JSON.stringify([]), "utf8", (err) => {
      if (err) {
        console.error("Error creating file:", err);
        return;
      }
    });
  }
});

// process images
async function processImages() {
  spinner.start("Checking Images");
  let files = await fsPromises.readdir(imagesFolder);

  // filter crawler log files from files
  const crawlerLog = fs.readFileSync(crawlerLogPath, "utf8");
  files = files.filter((file) => !crawlerLog.includes(file));

  for (const file of files) {
    spinner.text = `Checking ${file}`;
    const imagePath = `${imagesFolder}/${file}`;

    // Read the crawler log file
    fs.readFile(crawlerLogPath, "utf8", (err, result) => {
      if (err) {
        console.log("Error reading file from disk:", err);
        return;
      }
      try {
        const logs = JSON.parse(result);
        logs.push(file);
        const stringifyLogs = JSON.stringify(logs);

        // Write the crawler log to the file
        fs.writeFile(crawlerLogPath, stringifyLogs, "utf8", (err) => {
          if (err) {
            console.error("Error writing file:", err);
            return;
          }
        });
      } catch (err) {
        console.log("Error parsing JSON string:", err);
      }
    });

    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(imagePath);

      if (textsToDelete.some((phrase) => text.includes(phrase))) {
        await fsPromises.unlink(imagePath);
        await fsPromises.unlink(imagePath);

        // write the file name that needs to be deleted
        const deleteLog = fs.readFileSync(deleteLogPath, "utf8");
        const logs = JSON.parse(deleteLog);
        logs.push(file);
        const stringifyLogs = JSON.stringify(logs);

        // Write the delete log to the file
        fs.writeFile(deleteLogPath, stringifyLogs, "utf8", (err) => {
          if (err) {
            console.error("Error writing file:", err);
            return;
          }
        });
        console.log(`Deleted: ${file}`);
      } else {
        console.log(`Not Deleted: ${file}`);
      }
    } catch (err) {
      console.error("Error processing image:", err);
    }
  }
  spinner.succeed("Success - Checking Images");
}

// Wait for 1 second before starting the process
setTimeout(() => {
  processImages().catch((err) => {
    console.error("Error processing images:", err);
  });
}, 1000);
