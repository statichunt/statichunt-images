import fs from "fs";
import path from "path";

const imagesFolder = path.join(process.cwd(), "/tools/");
const thumbnailsFolder = path.join(process.cwd(), "/tools/thumbnails/");

// fetch tools
const getTools = await fetch("https://statichunt.com/data/tools.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const tools = getTools.map((data) => data.slug);

// delete obsolete images
fs.readdir(imagesFolder, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  // skip folders
  files = files.filter(
    (file) => !fs.lstatSync(imagesFolder + file).isDirectory()
  );
  files.forEach((file) => {
    if (!tools.includes(file.replace(".png", ""))) {
      fs.unlinkSync(imagesFolder + file);
      console.log(`Deleted: ${file}`);
    }
  });
});

// delete obsolete thumbnails
fs.readdir(thumbnailsFolder, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  // skip folders
  files = files.filter(
    (file) => !fs.lstatSync(thumbnailsFolder + file).isDirectory()
  );
  files.forEach((file) => {
    if (!tools.includes(file.replace(".webp", ""))) {
      fs.unlinkSync(thumbnailsFolder + file);
      console.log(`Deleted: ${file}`);
    }
  });
});
