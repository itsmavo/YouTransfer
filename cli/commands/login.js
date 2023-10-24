import { setTimeout } from 'node:timers/promises';
import querystring from 'node:querystring';
import enquirer from 'enquirer';
import { request } from 'undici';
import open from 'open';
import ora from 'ora';
import {config} from '../config.js';


export default async function login() {
    // prompt for the domain
    const  { baseurl } = await enquirer.prompt({
        type: 'input',
        name: 'baseurl',
        message: 'Enter the base url of the YouTransfer instance',
        validate: (input) => {
            try {
                new URL(input);
                return true;
            } catch {
                return 'Please enter a valid url';
            }
        },
        initial: config.get('baseurl') || 'https://you-tr.click'
    });

    const DEVICE_AUTH_URL = `${baseurl}/auth/device_authorization`;
    const deviceAuthResponse = await request(DEVICE_AUTH_URL, {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'user-agent': 'you-tr.click cli',
        },
    });
    const deviceAuthRespBody = await deviceAuthResponse.body.json();
    // start device auth flow and get redirect url and codes
    console.log(`Please visit ${deviceAuthRespBody.verification_uri_complete} to login`);
    try{
    // open the browser with the redirect url
    await open(deviceAuthRespBody.verification_uri_complete);
    } catch {}

    const spinner = ora('Waiting to complete the login in the browser...').start();
    // poll the server for the status of the code
    let loggedIn = null;

    const TOKEN_URL = `${baseurl}/auth/token`;
    const tokenPayload = querystring.encode({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceAuthRespBody.device_code,
    });
    const tokenHeaders = {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'you-tr.click cli',
    };

    while (!loggedIn){
        await setTimeout(deviceAuthRespBody.interval * 1000);

        const tokenResponse = await request(TOKEN_URL, {
            method: 'POST',
            headers: tokenHeaders,
            body: tokenPayload,
        });

        const tokenRespBody = await tokenResponse.body.json();

        if (tokenResponse.statusCode === 200) {
            loggedIn = tokenRespBody;
            spinner.succeed('Login successful');
        } else if (tokenRespBody.error_code !== 'authorization_pending') {
            spinner.fail(`Login failed: ${tokenRespBody.error_code}`);
            process.exit(1);
        }
    }
    
    // when the token is available, save it to the config file
    config.set('baseurl', baseurl);
    config.set('access_token', loggedIn.access_token);
    config.set('refresh_token', loggedIn.refresh_token);
    config.set('id_token', loggedIn.id_token);
    // close the browser, login is complete
}