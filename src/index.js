#!/usr/bin/env node

const program = require('commander');

const { deploy } = require('./commands/deploy');
const { destroy } = require('./commands/destroy');
const { configure } = require('./commands/configure');

program.description('Canopy Infrastructure Management API');
program.name('Canopy');

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