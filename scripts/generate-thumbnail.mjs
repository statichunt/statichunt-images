import fs from "fs";
import ora from "ora";
import path from "path";
import sharp from "sharp";
const spinner = ora("Loading");

// const generateThumbnail = async (demo, overwrite) => {
//   let themeKey = new URL(demo);
//   themeKey = `${await slug(themeKey.href)}`;
//   const hiresImage = path.join(config.hiresImagesFolder, `${themeKey}.png`);
//   const imageName = path.parse(hiresImage).name;
//   const outputImage = path.join(
//     config.thumbnailImagesFolder,
//     `${imageName}.png`
//   );

//   if (!hiresImage) {
//     return false;
//   }
//   if (!overwrite && fs.existsSync(outputImage)) {
//     return false;
//   }
//   fs.ensureDirSync(config.thumbnailImagesFolder);

//   try {
//     spinner.text = `${imageName} => processing thumbnail`;
//     await sharp(hiresImage)
//       .resize({
//         width: config.thumbnailWidth,
//         height: config.thumbnailHeight,
//         fit: "cover",
//         position: "bottom",
//       })
//       .jpeg({
//         quality: 85,
//       })
//       .toFile(outputImage);
//   } catch {
//     spinner.text = `${imageName} => processing failed`;
//     return false;
//   }
// };

// const generateThumbnails = async (demos, overwrite) => {
//   spinner.start("Generating Thumbnails");
//   for (const demo of demos) {
//     await generateThumbnail(demo, overwrite);
//   }
//   spinner.succeed("Success - Generating Thumbnails");
// };

// async function build(demos, overwrite) {
//   await generateThumbnails(demos, overwrite);
// }

// generate thumbnail
const generateThumbnail = async (file) => {
  const filePath = path.join("themes", file);
  const outputFilePath = path.join("themes-sm", file);

  sharp(filePath)
    .resize(300, 200)
    .webp()
    .toBuffer()
    .then((data) => {
      fs.writeFile(outputFilePath.replace(".png", ".webp"), data, (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
      });
    })
    .catch((err) => console.log(err));
};

// generate thumbnail for each file in themes folder
async function build() {
  const directoryPath = path.join("themes");
  spinner.start("Start Processing Images");
  fs.readdir(directoryPath, (err, files) => {
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

build();

// function resizeImages() {
//   const directoryPath = path.join("themes");
//   const outputDirectoryPath = path.join("themes-sm");
//   fs.readdir(directoryPath, (err, files) => {
//     if (err) {
//       return console.log("Unable to scan directory: " + err);
//     }
//     files.forEach((file) => {
//       console.log(file);
//       if (path.extname(file) === ".png") {
//         const filePath = path.join(directoryPath, file);
//         const outputFilePath = path.join(outputDirectoryPath, file);
//         sharp(filePath)
//           .resize(300, 200)
//           .webp()
//           .toBuffer()
//           .then((data) => {
//             fs.writeFile(
//               outputFilePath.replace(".png", ".webp"),
//               data,
//               (err) => {
//                 if (err) throw err;
//                 console.log("The file has been saved!");
//               }
//             );
//           })
//           .catch((err) => console.log(err));
//       }
//     });
//   });
// }

// resizeImages();
