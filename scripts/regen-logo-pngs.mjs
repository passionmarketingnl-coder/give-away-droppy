/**
 * Regenereert de gebruikte brand PNG's door de v2-originelen te trimmen.
 * Originele v2 PNG's blijven onaangeroerd als backup; de app gebruikt de
 * getrimde versies (logo-blue.png / logo-white.png / logo-blue-tagline.png
 * / favicon.png).
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const brandDir = path.resolve(process.cwd(), 'assets/brand');

async function trimResize({ src, dst, width }) {
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
  // v2 assets van huisstijl update (2026-07-27)
  await trimResize({ src: 'logo-blue-v2.png', dst: 'logo-blue.png', width: 1200 });
  await trimResize({ src: 'logo-white-v2.png', dst: 'logo-white.png', width: 1200 });
  await trimResize({ src: 'logo-blue-tagline-v2.png', dst: 'logo-blue-tagline.png', width: 1200 });
  await trimResize({ src: 'icon-v2.png', dst: 'favicon.png', width: 512 });
  await trimResize({ src: 'icon-v2.png', dst: 'icon.png', width: 1024 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
