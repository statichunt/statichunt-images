import fs from "fs";
import path from "path";

const imagesFolder = path.join(process.cwd(), "/examples/");
const thumbnailsFolder = path.join(process.cwd(), "/examples/thumbnails/");

// fetch examples
const getExamples = await fetch("https://statichunt.com/data/examples.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const examples = getExamples.map((data) => data.slug);

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
    if (!examples.includes(file.replace(".png", ""))) {
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
    if (!examples.includes(file.replace(".webp", ""))) {
      fs.unlinkSync(thumbnailsFolder + file);
      console.log(`Deleted: ${file}`);
    }
  });
});
