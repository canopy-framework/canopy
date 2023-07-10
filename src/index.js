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

program
  .command('deploy')
  .description("Deploy Canopy Infrastructure to AWS")
  .action(deploy);

program
  .command('destroy')
  .description("Destroy Canopy Infrastructure on AWS")
  .action(destroy);

program.parse(process.argv);