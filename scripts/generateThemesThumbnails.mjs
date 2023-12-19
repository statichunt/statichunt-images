import fs from "fs";
import ora from "ora";
import path from "path";
import sharp from "sharp";
const spinner = ora("Loading");

const imagesFolder = path.join(process.cwd(), "/themes/");
const thumbnailsFolder = path.join(process.cwd(), "/themes/thumbnails/");
const thumbnailHeight = 200;
const thumbnailWidth = 300;

// generate thumbnail
const generateThumbnail = async (file) => {
  const themeKey = file.replace(".png", "");
  const hiresImage = path.join(imagesFolder, `${themeKey}.png`);
  const outputImage = path.join(thumbnailsFolder, `${themeKey}.webp`);

  // if thumbnail already exists, skip
  if (fs.existsSync(outputImage)) {
    return false;
  }

  sharp(hiresImage)
    .resize(thumbnailWidth, thumbnailHeight)
    .webp()
    .toBuffer()
    .then((data) => {
      fs.writeFile(outputImage, data, (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
      });
    })
    .catch((err) => console.log(err));
};

// generate thumbnail for each file in themes folder
async function generateThumbnails() {
  spinner.start("Start Processing Images");
  fs.readdir(imagesFolder, (err, files) => {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    files.forEach((file) => {
      spinner.text = `Processing ${file}`;
      if (path.extname(file) === ".png") {
        generateThumbnail(file);
      }
    });
  });
  spinner.succeed("Success - Processing Images");
}

generateThumbnails();
