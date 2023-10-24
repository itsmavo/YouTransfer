#!/usr/bin/env node

import { program } from 'commander';
import upload from './commands/upload.js';
import login from './commands/login.js';
import logout from './commands/logout.js';

program
.name('youtransfer')
.description('Upload and download files using YouTransfer cli tool')
.addHelpText('after', `

To upload a file from the local file system, use the upload command:

$ youtransfer <filename>

`)

program
    .command('login')
    .action(login);

program
    .command('logout')
    .action(logout);

program
    .command('upload', { isDefault: true})
    
    .argument('<filepath>', 'path to the file to upload')
    .action(upload)

program
    .parse()