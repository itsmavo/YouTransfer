# Youtransfer

Youtransfer is a simple but elegant self-hosted file transfer & sharing solution. It's an alternative to paid services like Dropbox, WeTransfer.

## The idea behind Youtransfer
It was a challenge to myself to see if I could create a simple but effective self-hosted file transfer app. I wanted to create something that works fast and efficient, without complicated dependencies or processes. It had to be easy to install and easy to use.

## Use cases
Youtransfer can be used in many ways. You can use it as a personal file transfer app, or if you're running a small business, you can use it to share files with your clients. It's also a great way to share files with friends and family.
This code base will allow you to run your own instance of Youtransfer. You can use it for free, and you can modify it to your own needs.

## Features
- Upload a file using REST APIs or a CLI application
- Ability to configure the stack to a custom domain
- Authentication (OAuth 2.0 & OAuth 2.0 device flow)

## Architecture

Youtransfer is a Node.js application that uses the following components:

- **Lambda** - A serverless function that handles the file upload and stores the file in an S3 bucket
- **API Gateway** - A REST API that handles the file upload and stores the file in an S3 bucket
- **S3** - A storage service that stores the files
- **Cognito** - A user pool that handles the authentication
- **Route 53** and **ACM** - A DNS service that handles the custom domain names and certificates

The CLI authentication uses the OAuth 2.0 device flow. The CLI application will generate a URL that you can use to authenticate. You can then enter the code that is displayed on the screen to authenticate the CLI application.

## Installation

### Prerequisites
- Your AWS account
- [Node.js] (16.x or higher)
- [AWS CLI]
- [Serverless Framework](v3 or higher)
- Your custom domain (easier with Route 53)
- A bash-compatible environment (Linux, macOS, Windows Subsystem for Linux)

Feel free to reach out to me if you need help with the installation.

## Minor Installation
### 1. Clone this repository
First of all, clone this repository to your local machine.
```bash
git clone git@github.com:itsmavo/YouTransfer.git
cd youtransfer/cli
```

## Usage
1. Install the `youtransfer` CLI application with `npm install -g youtransfer`
2. Login with `youtransfer login`
3. Upload a file with `youtransfer upload <file>`

For more information, run `youtransfer --help`.

## License
Youtransfer is licensed under the [MIT License](LICENSE). @itsmavo