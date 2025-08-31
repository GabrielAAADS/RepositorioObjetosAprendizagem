const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const mime = require('mime-types');

const hasS3 = !!process.env.S3_BUCKET && !!process.env.AWS_ACCESS_KEY_ID;

const s3 = hasS3 ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT || undefined,
  forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
}) : null;

function extractKeyFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    let key = u.pathname.replace(/^\/+/, '');
    const hostParts = host.split('.');
    const isVirtualHost = host.includes('s3');
    if (!isVirtualHost && key.includes('/')) key = key.split('/').slice(1).join('/');
    return key;
  } catch {
    return null;
  }
}

async function signDownload({ bucket, key, filename, expires = 600 }) {
  if (!s3) throw new Error('S3 não configurado');

  const contentType = mime.lookup(filename) || 'application/octet-stream';

  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: contentType,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: expires });
  return url;
}

module.exports = {
  hasS3,
  signDownload,
  extractKeyFromUrl,
};
