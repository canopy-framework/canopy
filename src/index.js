#!/usr/bin/env node

const program = require('commander');

program.description('Canopy Infrastructure Management API');
program.name('Canopy');

const deploy = () => {
  console.log("Deploying AWS infrastructure necessary to run Canopy");
}

const destroy = () => {
  console.log("Destroying Canopy AWS infrastructure");
}


const configure = (options) => {
  console.log("You have submitted your AWS credentials successfully.");
  console.log("access key", options.accessKey, "secret password", options.secretPassword);
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
  .requiredOption('-ak, --accessKey <key>', 'Access Key')
  .requiredOption('-sp, --secretPassword <password>', 'Secret Password')
  .description("Configure your AWS credentials")
  .action(configure);

program.parse(process.argv);