import fs from "fs";
import path from "path";
// import themesJson from "../themes.json" assert { type: "json" };

const imagesFolder = path.join(process.cwd(), "/themes/");
const thumbnailsFolder = path.join(process.cwd(), "/themes/thumbnails/");

// fetch themes
const getThemes = await fetch("https://statichunt.com/data/themes.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const themes = getThemes.map((data) => data.slug);

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
    if (!themes.includes(file.replace(".png", ""))) {
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
    if (!themes.includes(file.replace(".webp", ""))) {
      fs.unlinkSync(thumbnailsFolder + file);
      console.log(`Deleted: ${file}`);
    }
  });
});
