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
  // make it so answers looks exactly the same if options are passed in or if the prompt is used
  let answers = options;
  if (Object.keys(answers).length === 0) {
    const promptAnswers = await inquirer.prompt([
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

    console.log(promptAnswers);
    // {
    //   accountNumber: '123',
    //   distributionId: '123',
    //   httpEndpoint: 'https://asdf',
    //   accessKeyId: '3',
    //   secretAccessKey: '3',
    //   region: '3'
    // }

    console.log();
  }
  console.log(options);

  // {
  //   AccountNumber: 'as',
  //   DistributionID: 'as',
  //   HTTPEndpoint: 'a',
  //   SecretKey: '3',
  //   Region: '3',
  //   AccessKeyID: '234'
  // }


//   console.log(answers.accountNumber, answers.distributionId, answers.httpEndpoint, answers.accessKeyId, answers.secretAccessKey, answers.region);

//   fs.writeFileSync('./aws-config.json', JSON.stringify({
//     accountNumber: answers.accountNumber,
//     distributionId: answers.distributionId,
//     httpEndpoint: answers.httpEndpoint,
//     region: answers.region,
//   }, null, 2));
  
//   // Commands for configuring AWS credentials & bootstrapping
//   const configureAccessKeyId = `aws configure set aws_access_key_id ${answers.accessKeyId}`;
//   const configureSecretKey = `aws configure set aws_secret_access_key ${answers.secretAccessKey}`;
//   const configureRegion = `aws configure set region ${answers.region}`;
//   const configureNginx = `node create_nginx_config.js ${answers.httpEndpoint.replace(/^https:\/\//, '')}`;
//   const bootstrap = `cdk bootstrap ${answers.accountNumber}/${answers.region}`;
  
//   // Execute above commands
//   await exec(configureAccessKeyId);
//   await exec(configureSecretKey);
//   await exec(configureRegion);
//   await exec(configureNginx);

//   // Bootstrap AWS environment with CDK resources
//   const spinner = ora('Bootstrapping AWS environment with CDK resources').start();
//   try {
//     await exec(bootstrap);
//     spinner.succeed('Bootstrapping successful. You are now ready for deployment.');
//   } catch (error) {
//     spinner.fail('Bootstrapping failed.')
//     console.log(error);
//   }
}

module.exports = { configure };