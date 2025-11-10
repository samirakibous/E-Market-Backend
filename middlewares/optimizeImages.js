import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const defaultOptions = {
  maxWidth: 1200,
  quality: 80,
  convertToWebP: true,
  skipIfSmaller: true,
  keepOriginalFormat: false,
};

// Check if an image should be optimized
function shouldOptimizeImage(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.includes(ext);
}

// Generate WebP filename
function getWebPFilename(originalFilename) {
  const nameWithoutExt = path.basename(
    originalFilename,
    path.extname(originalFilename)
  );
  return `${nameWithoutExt}.webp`;
}

// Optimize image and convert to WebP
async function optimizeSingleImage(file, options) {
  try {
    const filePath = file.path;

    // Skip if not an image or if file doesn't exist
    if (!shouldOptimizeImage(file.filename) || !filePath) {
      console.log(`Skipping ${file.filename} - not an optimizable image`);
      return file;
    }

    // Read the original file
    const imageBuffer = await fs.readFile(filePath);
    const originalStats = await fs.stat(filePath);

    const metadata = await sharp(imageBuffer).metadata();
    const originalFormat = path
      .extname(file.filename)
      .toLowerCase()
      .replace('.', '');

    // Skip if image is already small and we're not converting to WebP
    if (
      options.skipIfSmaller &&
      metadata.width &&
      metadata.width <= options.maxWidth &&
      !options.convertToWebP
    ) {
      console.log(`Skipping ${file.filename} - already optimized size`);
      return file;
    }

    let optimizedBuffer;
    let outputFormat = originalFormat;
    let outputFilename = file.filename;
    let outputPath = filePath;

    // Create sharp instance with basic operations
    let sharpInstance = sharp(imageBuffer).rotate().resize({
      width: options.maxWidth,
      withoutEnlargement: true,
      fit: 'inside',
    });

    // Decide on output format
    if (options.convertToWebP && originalFormat !== 'gif') {
      // Convert to WebP
      outputFormat = 'webp';
      outputFilename = getWebPFilename(file.filename);
      outputPath = path.join(path.dirname(filePath), outputFilename);

      optimizedBuffer = await sharpInstance
        .webp({
          quality: options.quality,
          effort: 4, // CPU effort
        })
        .toBuffer();

      console.log(`Converting ${file.filename} to WebP format`);
    } else {
      // Keep original format but optimize
      switch (originalFormat) {
        case 'jpg':
        case 'jpeg':
          optimizedBuffer = await sharpInstance
            .jpeg({
              quality: options.quality,
              progressive: true, // Progressive loading
              mozjpeg: true, // Better compression
            })
            .toBuffer();
          break;

        case 'png':
          optimizedBuffer = await sharpInstance
            .png({
              compressionLevel: 9,
              progressive: true,
              palette: true, // Reduce colors for smaller files
            })
            .toBuffer();
          break;

        case 'webp':
          optimizedBuffer = await sharpInstance
            .webp({
              quality: options.quality,
              effort: 4,
            })
            .toBuffer();
          break;

        case 'gif':
          if (options.convertToWebP) {
            outputFormat = 'webp';
            outputFilename = getWebPFilename(file.filename);
            outputPath = path.join(path.dirname(filePath), outputFilename);

            optimizedBuffer = await sharpInstance
              .webp({
                quality: options.quality,
                effort: 4,
              })
              .toBuffer();
          } else {
            console.log(`Keeping GIF ${file.filename} as original format`);
            return file;
          }
          break;

        default:
          console.log(`Unsupported format for ${file.filename}`);
          return file;
      }
    }

    // Only replace if new file is smaller
    const shouldReplace =
      !options.skipIfSmaller ||
      optimizedBuffer.length < originalStats.size ||
      options.convertToWebP;

    if (shouldReplace) {
      // Write the optimized file
      await fs.writeFile(outputPath, optimizedBuffer);

      // If we created a new file delete the original
      if (outputPath !== filePath && !options.keepOriginalFormat) {
        await fs.unlink(filePath);
      }

      // Update file object with new information
      file.filename = outputFilename;
      file.path = outputPath;
      file.size = optimizedBuffer.length;

      const sizeReduction = (
        ((originalStats.size - optimizedBuffer.length) / originalStats.size) *
        100
      ).toFixed(1);
      console.log(
        `Optimized ${file.filename}: ${originalStats.size} → ${optimizedBuffer.length} bytes (${sizeReduction}% reduction)`
      );
    } else {
      console.log(
        `Kept original ${file.filename} - optimization didn't reduce size`
      );
    }

    return file;
  } catch (error) {
    console.error(`Error optimizing ${file.filename}:`, error.message);
    // keep original file if optimization fails
    return file;
  }
}

// Main optimization middleware with WebP support
export const optimizeImages = (userOptions = {}) => {
  const options = { ...defaultOptions, ...userOptions };

  return async (req, res, next) => {
    try {
      // If no files, move to next middleware
      if (!req.files && !req.file) {
        return next();
      }

      console.log('Starting image optimization with WebP conversion...');

      // Collect all files
      const allFiles = [];

      // Handle single file
      if (req.file) {
        allFiles.push(req.file);
      }

      // Handle multiple files
      if (req.files) {
        if (Array.isArray(req.files)) {
          allFiles.push(...req.files);
        } else {
          // If req.files is an object with arrays
          Object.values(req.files).forEach((fieldFiles) => {
            if (Array.isArray(fieldFiles)) {
              allFiles.push(...fieldFiles);
            }
          });
        }
      }

      // Filter only images that need optimization
      const imagesToOptimize = allFiles.filter(
        (file) => file && shouldOptimizeImage(file.filename)
      );

      console.log(`Found ${imagesToOptimize.length} images to optimize`);

      // Process images in parallel
      const optimizationPromises = imagesToOptimize.map((file) =>
        optimizeSingleImage(file, options)
      );

      // Wait for all optimizations to complete
      await Promise.all(optimizationPromises);

      console.log('Image optimization with WebP conversion completed');
      next();
    } catch (error) {
      console.error('Error in optimizeImages middleware:', error);
      // Don't stop the request if optimization fails
      next();
    }
  };
};

// Export additional utility function for WebP checking
export const checkWebPSupport = (req) => {
  // Check if client supports WebP via Accept header
  const acceptHeader = req.headers.accept || '';
  return acceptHeader.includes('image/webp');
};
