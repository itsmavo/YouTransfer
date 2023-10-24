import { Metrics, logMetrics, MetricUnits } from "@aws-lambda-powertools/metrics";
import { Tracer, captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
import middy from "@middy/core";
import httpContentNegotiation from "@middy/http-content-negotiation";
import httpHeaderNormalizer from "@middy/http-header-normalizer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {randomUUID} from 'node:crypto';
import sanitizeFilename from 'sanitize-filename';


const tracer = new Tracer();
const logger = new Logger();
const metrics = new Metrics();
const { BUCKET_NAME, BASE_URL } = process.env;
const EXPIRY_DEFAULT = 60 * 60 * 24; // 24 hours
const s3Client = new S3Client();
const MIME_TYPE = 'application/octet-stream';

async function handler (event, context) {
  const id = randomUUID();
  const key = `shares/${id[0]}/${id[1]}/${id}`;
  // Create a key (filename)

  const filename = event?.queryStringParameters?.filename;
  const sanitizedFilename = filename && sanitizeFilename(filename)
  const contentDisposition = sanitizedFilename && `attachment; filename="${sanitizedFilename}"`;
  const contentDispositionHeader = contentDisposition && `content-disposition: ${contentDisposition}`;

  logger.info('Creating a new share', { id, key, filename, contentDispositionHeader })
  metrics.addMetric('createShareCount', MetricUnits.Count, 1);

  
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

  let headers = {
    'content-type': 'text/plain',
  };

  let body = `
  Upload with: curl -X PUT -T ${filename || '<FILENAME>'} ${contentDispositionHeader? `-H '${contentDispositionHeader}'` : ''} '${uploadUrl}'

  Download with: curl ${downloadUrl}
  `;

  if (event.preferredMediaType === 'application/json') {
    body = JSON.stringify({ 
      filename,
      headers: {
        'content-disposition': contentDisposition 
      },
      uploadUrl,
      downloadUrl
     });
    headers = {
      'content-type': 'application/json',
    };
  }

  return {
    statusCode: 201,
    body,
  };  
}

export const handleEvent = middy(handler)
  .use(injectLambdaContext(logger, {logEvent: true}))
  .use(logMetrics(metrics))
  .use(captureLambdaHandler(tracer))
  .use(httpHeaderNormalizer())
  .use(httpContentNegotiation({
    parseCharsets: false,
    parseEncodings: false,
    parseLanguages: false,
    failOnMismatch: false,
    availableMediaTypes: ['application/json'],
  }))


