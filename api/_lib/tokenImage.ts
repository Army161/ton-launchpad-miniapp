import sharp from 'sharp';

// Kept apart from imageGen.ts so that /api/health, which only reads the generator's settings, never loads sharp.

/** Edge of the stored square image in pixels. */
export const TOKEN_IMAGE_SIZE = 512;

/**
 * Turns whatever the provider sent into the stored token image: a 512 px square JPEG (about 50 KB), centre-cropped,
 * metadata stripped. Throws when the bytes are not an image sharp can read.
 */
export async function toTokenImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: 4096 * 4096, failOn: 'error' })
    .rotate()
    .resize(TOKEN_IMAGE_SIZE, TOKEN_IMAGE_SIZE, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}
