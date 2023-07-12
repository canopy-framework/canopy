#!/usr/bin/env node

const inquirer = require('inquirer');
const program = require('commander');
const fs = require('fs');
const { deploy } = require('./commands/deploy');


program.description('Canopy Infrastructure Management API');
program.name('Canopy');



const destroy = () => {
  console.log("Destroying Canopy AWS infrastructure");
}

const configure = async () => {
  // need to add validation
  const answers = await inquirer.prompt([
    {
        name: "accessKey",
        message: "Please enter your access key:",
    },
    {
      name: "secretAccessKey",
      message: "Please enter your secret access key:",
    },
    {
      name: "cloudfrontARN",
      message: "Please enter the ARN of a currently running CloudFront Distribution:",
    },
]);
console.log(answers.accessKey, answers.secretAccessKey, answers.cloudfrontARN);
fs.writeFileSync('./fake-aws-creds.json', JSON.stringify({accessKey: answers.accessKey, secretAccessKey: answers.secretAccessKey, cloudfrontARN: answers.cloudfrontARN}, null, 2))
}

program
  .command('deploy')
  .description("Deploy Canopy Infrastructure to AWS")
  .action(deploy);

program
  .command('destroy')
  .description("Destroy Canopy Infrastructure on AWS")
  .action(destroy);

program
  .command('configure')
  .description("Configure your AWS credentials")
  .action(configure);

program.parse(process.argv);