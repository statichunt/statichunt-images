import fs from "fs";
import path from "path";

const imagesFolder = path.join(process.cwd(), "/themes/");

// fetch themes
const getThemes = await fetch("https://statichunt.com/data/themes.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const themes = getThemes.map((data) => data.slug);

fs.readdir(imagesFolder, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach((file) => {
    if (!themes.includes(file.replace(".png", ""))) {
      fs.unlinkSync(imagesFolder + file);
      console.log(`Deleted: ${file}`);
    }
  });
});
