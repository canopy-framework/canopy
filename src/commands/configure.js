const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);

async function validHttpEndpoint(endpoint) {
  const regex = new RegExp('^https://.*');
  return regex.test(endpoint);
}

const configure = async (options) => {
  // need to add validation
  const numOfOptions = Object.keys(options).length;
  let answers = {};

  if (numOfOptions > 0 && numOfOptions < 6) {
    console.log("You must pass in all options");
    process.exit(0);
  } else if (numOfOptions === 0) {
    answers = await inquirer.prompt([
      {
        name: "accountNumber",
        message: "Please enter your AWS account number:",
      },
      {
        name: "distributionId",
        message: "Please enter your CloudFront distribution ID:",
      },
      {
        name: "httpEndpoint",
        message: "Please enter an HTTP endpoint for Firehose delivery (format: https://xyz.httpendpoint.com):",
        validate: validHttpEndpoint,
      },
      {
        name: "accessKeyId",
        message: "Please enter your AWS access key ID:",
      },
      {
        name: "secretAccessKey",
        message: "Please enter your AWS secret access key:",
      },
      {
        name: "region",
        message: "Please enter your AWS region:"
      },
    ]);
  }

  Object.keys(options).forEach((key) => {
    const lowerCaseKey = key[0].toLowerCase() + key.slice(1);
    answers[lowerCaseKey] = options[key]
  })

  console.log(answers.accountNumber, answers.distributionId, answers.httpEndpoint, answers.accessKeyId, answers.secretAccessKey, answers.region);

  fs.writeFileSync('./aws-config.json', JSON.stringify({
    accountNumber: answers.accountNumber,
    distributionId: answers.distributionId,
    httpEndpoint: answers.httpEndpoint,
    region: answers.region,
  }, null, 2));
  
  // Commands for configuring AWS credentials & bootstrapping
  const configureAccessKeyId = `aws configure set aws_access_key_id ${answers.accessKeyId}`;
  const configureSecretKey = `aws configure set aws_secret_access_key ${answers.secretAccessKey}`;
  const configureRegion = `aws configure set region ${answers.region}`;
  // const configureNginx = `node create_nginx_config.js ${answers.httpEndpoint.replace(/^https:\/\//, '')}`;
  const bootstrap = `cdk bootstrap ${answers.accountNumber}/${answers.region}`;
  
  // Execute above commands
  await exec(configureAccessKeyId);
  await exec(configureSecretKey);
  await exec(configureRegion);
  // await exec(configureNginx);

  // Bootstrap AWS environment with CDK resources
  const spinner = ora('Bootstrapping AWS environment with CDK resources').start();
  try {
    await exec(bootstrap);
    spinner.succeed('Bootstrapping successful.\n');

    const steps = 
    [`Next steps:`,
     `1) Place your SSL certificate file in .pem format into the project root directory as "fullchain.pem".`, 
     `2) Place your SSL certificate private key file in .pem format into the project's root directory as "privkey.pem".\n`, 
     `These files will be passed as parameters during deployment to set up a destination HTTP endpoint for AWS Firehose.\n`,
     `3) Once the files are provided, you will be ready for deployment.`
    ].join('\n');

    console.log(steps);
  } catch (error) {
    spinner.fail('Bootstrapping failed.')
    console.log(error);
  }
}

module.exports = { configure };