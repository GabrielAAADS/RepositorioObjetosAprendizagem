require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const driver = process.env.STORAGE_DRIVER || 'local';

async function saveLocal(file) {
  const storageDir = path.join(__dirname, '../../storage');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
  const timestamp = Date.now();
  const safeName = file.originalname.replace(/\s+/g, '_');
  const filename = `${timestamp}-${safeName}`;
  const dest = path.join(storageDir, filename);
  fs.renameSync(file.path, dest);
  return `/storage/${filename}`;
}

async function saveS3(file) {
  const s3 = new S3Client({ region: process.env.AWS_REGION });
  const timestamp = Date.now();
  const safeName = file.originalname.replace(/\s+/g, '_');
  const key = `${timestamp}-${safeName}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype,
    ACL: 'public-read'
  }));

  fs.unlinkSync(file.path);

  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = {
  saveFile: driver === 's3' ? saveS3 : saveLocal
};
