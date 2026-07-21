/**
 * Regenereert de brand PNG's uit de SVG bronbestanden.
 * Trim snijdt de transparante rand weg zodat het logo strak tegen zijn eigen
 * letters ligt (SVG viewBox had ruime padding boven en onder).
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const brandDir = path.resolve(process.cwd(), 'assets/brand');

async function trimResizeSvg({ src, dst, width }) {
  const buffer = await sharp(path.join(brandDir, src))
    .resize({ width })
    .trim()
    .png()
    .toBuffer();
  writeFileSync(path.join(brandDir, dst), buffer);
  const meta = await sharp(buffer).metadata();
  console.log(`${dst}: ${meta.width}x${meta.height}`);
}

async function main() {
  await trimResizeSvg({ src: 'logo-blue.svg', dst: 'logo-blue.png', width: 1200 });
  await trimResizeSvg({ src: 'logo-white.svg', dst: 'logo-white.png', width: 1200 });
  await trimResizeSvg({ src: 'favicon.svg', dst: 'favicon.png', width: 512 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
