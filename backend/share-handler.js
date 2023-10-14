import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {randomUUID} from 'node:crypto';


const { BUCKET_NAME, BASE_URL } = process.env;
const EXPIRY_DEFAULT = 60 * 60 * 24; // 24 hours
const s3Client = new S3Client();
const MIME_TYPE = 'application/octet-stream';

export const handleEvent = async (event, context) => {
  const id = randomUUID();
  const key = `shares/${id[0]}/${id[1]}/${id}`;
  // Create a key (filename)

  const filename = event?.queryStringParameters?.filename;
  const contentDisposition = filename && `attachment; filename="${filename}"`;
  const contentDispositionHeader = contentDisposition && `content-disposition: ${contentDisposition}`;

  
  // Create and Return the Download URL
 const downloadUrl = `${BASE_URL}/share/${id}`;

  // Create an Upload URL
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentDisposition: contentDisposition,
  });

  const signableHeaders = new Set([`content-type: ${MIME_TYPE}`])
  if (contentDisposition) {
    signableHeaders.add(contentDispositionHeader)
  }

  const uploadUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: EXPIRY_DEFAULT,
    signableHeaders,
  });

  return {
    statusCode: 201,
    body: `
    Upload with: curl -X PUT -T ${filename || '<FILENAME>'} ${contentDispositionHeader? `-H '${contentDispositionHeader}'` : ''} '${uploadUrl}'

    Download with: curl ${downloadUrl}
    
    `,
  };
  
}


