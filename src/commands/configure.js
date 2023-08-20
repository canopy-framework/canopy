const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const input = require(path.join(__dirname, "../utils/user-input-validation"));

const configure = async (options) => {
  const numOfOptions = Object.keys(options).length;
  let answers = {};

  if (numOfOptions > 0 && numOfOptions < 5) {
    console.log("You must pass in all options");
    process.exit(0);
  } else if (numOfOptions === 0) {
    answers = await inquirer.prompt([
      {
        name: "accountNumber",
        message: "Please enter your AWS account number:",
        validate: input.isValidAWSAccountNumber,
      },
      {
        name: "distributionId",
        message: "Please enter your CloudFront distribution ID:",
        validate: input.isValidCloudFrontDistributionID,
      },
      {
        name: "realtimeBuffer",
        message: "Please enter your desired real-time buffer interval(1-60) in seconds:",
        validate: input.isValidRealtimeBuffer
      },
      {
        name: "accessKeyId",
        message: "Please enter your AWS access key ID:",
        validate: input.isValidAWSAccessKeyID
      },
      {
        type: "password",
        mask: true,
        name: "secretAccessKey",
        message: "Please enter your AWS secret access key:",
        validate: input.isValidAWSSecretAccessKey
      },
      {
        type: "list",
        name: "region",
        message: "Please choose one of the following AWS regions:",
        choices: ['us-east-1', 'us-west-2', 'eu-west-1', "eu-south-1", "eu-south-2", /* please add other regions you tested from your end */],
      }
    ]);
  }

  Object.keys(options).forEach((key) => {
    const lowerCaseKey = key[0].toLowerCase() + key.slice(1);
    answers[lowerCaseKey] = options[key]
  })

  fs.writeFileSync(path.join(__dirname, '../../aws-config.json'), JSON.stringify({
    accountNumber: answers.accountNumber,
    distributionId: answers.distributionId,
    region: answers.region,
    realtimeBuffer: answers.realtimeBuffer
  }, null, 2));
  
  // Commands for configuring AWS credentials & bootstrapping
  const configureAccessKeyId = `aws configure set aws_access_key_id ${answers.accessKeyId}`;
  const configureSecretKey = `aws configure set aws_secret_access_key ${answers.secretAccessKey}`;
  const configureRegion = `aws configure set region ${answers.region}`;
  const bootstrap = `cdk bootstrap ${answers.accountNumber}/${answers.region}`;
  
  // Execute above commands
  const configSpinner = ora('Setting up AWS credentials & configuration').start();
  try {
    await exec(configureAccessKeyId);
    await exec(configureSecretKey);
    await exec(configureRegion);
    configSpinner.succeed('AWS credentials & configuration setup successful.');
  } catch(error) {
    configSpinner.fail('AWS credentials & configuration setup failed.')
    console.log(error);
  }

  // Bootstrap AWS environment with CDK resources
  const spinner = ora('Bootstrapping AWS environment with CDK resources').start();
  try {
    await exec(bootstrap);
    spinner.succeed('Bootstrapping successful.');
  } catch (error) {
    spinner.fail('Bootstrapping failed.')
    console.log(error);
  }
}

module.exports = { configure };
