#!/usr/bin/env node

const inquirer = require('inquirer');
const program = require('commander');


program.description('Canopy Infrastructure Management API');
program.name('Canopy');

const deploy = () => {
  console.log("Deploying AWS infrastructure necessary to run Canopy");
}

const destroy = () => {
  console.log("Destroying Canopy AWS infrastructure");
}


const configure = async () => {
  const answers = await inquirer.prompt([
    {
        name: "accessKey",
        message: "Please enter your access key:",
    },
    {
      name: "secretAccessKey",
      message: "Please enter your secret access key:",
  },
]);
console.log(answers.accessKey, answers.secretAccessKey);
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