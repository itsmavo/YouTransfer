
import { basename } from 'node:path';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { request } from 'undici';
import { config } from '../config.js';


export default async function upload (filepath) {
    const baseurl = config.get('baseurl');
    const access_token = config.get('access_token');

    if (!baseurl || !access_token) {
        console.error('It looks like you are not logged in. Please run :\n\n$ youtransfer login');
        process.exit(1);
    }

    const SHARE_URL = `${baseurl}/share/`;

    try{
        //read the filepath and check if it exists and its a file
        const stats = await stat(filepath);
        if(!stats.isFile()){
            throw new Error(`The provided path ${filepath} is not a file`);
        }
        const filename = basename(filepath);
        const shareURL = new URL(SHARE_URL);
        shareURL.searchParams.append('filename', filename);

        // call the youtransfer api to get the upload url with the filepath name
        const shareUrlResponse = await request(shareURL, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'user-agent': 'you-tr.click cli',
                'authorization': `Bearer ${access_token}`,
            }
        });
        if (shareUrlResponse.statusCode !== 201) {
            const responseText = await shareUrlResponse.body.text();
            throw new Error(`Unexpected status code received from the server: ${shareUrlResponse.statusCode}\n\n${responseText}`);
        }
        
        const shareUrlRespBody = await shareUrlResponse.body.json();

        const fileStream = createReadStream(filepath);

        //upload the file using the presigned uploadurl
        const uploadResponse = await request(shareUrlRespBody.uploadUrl, {
            method: 'PUT',
            headers: {
                'content-type': 'application/octet-stream',
                'content-length': stats.size,
                ...shareUrlRespBody.headers,
            },
            body: fileStream,
        });

        if (uploadResponse.statusCode !== 200) {
            const responseText = await uploadResponse.body.text();
            throw new Error(`Unexpected status code received from the server: ${uploadResponse.statusCode}\n\n${responseText}`);
        }

        //print the download url
        console.log(shareUrlRespBody.downloadUrl);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}