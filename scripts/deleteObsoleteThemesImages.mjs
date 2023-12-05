import fs from "fs";
// import themes from "../.json/themes-name.json" assert { type: "json" };

const folderPath = "/themes/";

// fetch themes
const getThemes = await fetch("https://statichunt.com/data/themes.json")
  .then((response) => response.json())
  .catch((error) => console.error("Error:", error));

const themes = getThemes.map((data) => data.slug);

fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  files.forEach((file) => {
    if (!themes.includes(file.replace(".png", ""))) {
      fs.unlinkSync(folderPath + file);
      console.log(`Deleted: ${file}`);
    }
  });
});
