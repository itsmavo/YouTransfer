import { Metrics, logMetrics, MetricUnits } from "@aws-lambda-powertools/metrics";
import { Tracer, captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
import middy from "@middy/core";

import cryptoRandomString from 'crypto-random-string';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { CODE_EXPIRY_SECONDS, TABLE_NAME} from './config.js'
import { DeviceAuthStatus } from './constants.js'
import { htmlResponse } from "./util.js";

const tracer = new Tracer();
const logger = new Logger();
const metrics = new Metrics();

const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocument.from(ddbClient);

/**
 * RFC6749 OAuth 2.0 Authorization Code Grant callback (redirection endpoint) handler
 * https://www.rfc-editor.org/rfc/rfc6749#section-3.1.2
 *
 * @param {*} event Lambda HTTP API Event
 */

async function handler (event, context) {
    const { code, state, error, error_description: errorDescription } = event.queryStringParameters;
    if (!state || !code) {
        // The user may have arrived here by logging in directly on the Cognito hosted UI
        // without initiating the proper device authorization flow.
        return htmlResponse(400, 'To log in to you-tr.click, use the <b>youtransfer CLI</b>');
    }

    metrics.addMetric('IdpCallbackCount', MetricUnits.Count, 1);
    const stateKey = `state#${state}`;
    const now = Date.now() / 1000;

    const queryItemInput = {
        TableName: TABLE_NAME,
        IndexName: 'gsi2',
        KeyConditionExpression: 'gsi2pk = :stateKey and gsi2sk = :stateKey',
        ExpressionAttributeValues: {
            ':stateKey': stateKey
        }
    };

    logger.info({queryItemInput}, 'Querying item');
    // TODO: Catch errors for not found / expired condition / bad state
    const ddbQueryResponse = await docClient.query(queryItemInput);
    logger.info({ ddbResponse: ddbQueryResponse}, 'Received Query response');
    if (ddbQueryResponse.Items?.length !== 1) {
        return htmlResponse(400, 'Unable to verify user code');
    }

    const { pk, sk } = ddbQueryResponse.Items[0];

    const status = error ? DeviceAuthStatus.ERROR : DeviceAuthStatus.CODE_ISSUED;
    const updateExp = 'set #status = :status, ' + (error ? '#errorCode = :errorCode, #errorDesc = :errorDescr' : '#code = :code');

    const updateInput = {
        TableName: TABLE_NAME,
        Key: { pk,sk},
        UpdateExpression: updateExp,
        ExpressionAttributeNames: {
            '#status': 's',
            '#exp': 'expiration',
            ...(error ? {
                '#errorCode': 'errorCode',
                '#errorDesc': 'errorDesc'
            } : {
            '#code': 'code',
            }),
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':prevStatus': 'verified',
            ':expiryTime': now + CODE_EXPIRY_SECONDS,
            ...(error ? {
                ':errorCode': error,
                ':errorDescr': errorDescription || ''
            } : {
                ':code': code,
            }),
        },
        ConditionExpression: '#status = :prevStatus AND #exp <= :expiryTime'
    };

    try{
        logger.info({updateInput}, 'Updating with code or error');
        const ddbResponse = await docClient.update(updateInput);
        logger.info({ddbResponse}, 'Received update response');
    } catch (err) {
        if (err.name === 'ConditionalCheckFailedException') {
            return htmlResponse(400, 'The token is expired or already verified');
        }
        logger.error({err});
        return htmlResponse(500, `Oops! Something went wrong with request ID: ${context.awsRequestId}`);
    }

    if (error) {
        return htmlResponse(400, `Error(${error}): ${errorDescription}`);
    }
    
    return htmlResponse(200, 'You can now close this window and return to the youtransfer client.');
}
export const handleEvent = middy(handler)
    .use(injectLambdaContext(logger, {logEvent: true}))
    .use(logMetrics(metrics))
    .use(captureLambdaHandler(tracer))