const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);

// async function validHttpEndpoint(endpoint) {
//   const regex = new RegExp('^https://.*');
//   return regex.test(endpoint);
// }

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
    region: answers.region,
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
    spinner.fail('AWS credentials & configuration setup failed.')
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