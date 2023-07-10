#!/usr/bin/env node

const program = require('commander');

program.description('Canopy Infrastructure Management API');
program.name('Canopy');

const deploy = () => {
  console.log("Deploying AWS infrastructure necessary to run Canopy");
}

program
  .command('deploy')
  .description("Deploy Canopy Infrastructure to AWS")
  .action(deploy);


program.parse(process.argv);