import sharp from 'sharp';

async function run() {
  await sharp('public/logo.webp')
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile('icon-square.png');
  console.log('done');
}
run();