import { Metrics, logMetrics, MetricUnits } from "@aws-lambda-powertools/metrics";
import { Tracer, captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
import middy from "@middy/core";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const tracer = new Tracer();
const logger = new Logger();
const metrics = new Metrics();
const { BUCKET_NAME } = process.env;
const EXPIRY_DEFAULT = 60
const s3Client = new S3Client(); 

async function handler (event, context)  {
    //extract the id from the URL (path parameter = id)
    const id = event.pathParameters.id;
    // create a presigned URL for the file in the bucket with the given id
    const key  = `shares/${id[0]}/${id[1]}/${id}`;
    const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    const downloadUrl = await getSignedUrl(s3Client, getCommand, {
        expiresIn: EXPIRY_DEFAULT,
    });
    logger.info('Downloading Share', { id , key });
    metrics.addMetric('downloadShare', MetricUnits.Count, 1);
    // return the HTTP redirect response to the presigned URL
    return {
        statusCode: 301,
        headers: {
            Location: downloadUrl,
        },
    };
}

export const handleEvent = middy(handler)
    .use(injectLambdaContext( logger, { logEvents: true }))
    .use(logMetrics(metrics))
    .use(captureLambdaHandler(tracer));