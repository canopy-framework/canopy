#!/usr/bin/env node

const program = require('commander');

const { add } = require('./commands/add');
const { deploy } = require('./commands/deploy');
const { destroy } = require('./commands/destroy');
const { configure } = require('./commands/configure');
const { provisionAlert } = require('./commands/provisionAlert');
const { launchDashboard } = require('./commands/launchDashboard');

program.description('Canopy Infrastructure Management API');
program.name('Canopy');

program
  .command('add')
  .description('Attach Real-Time Log Configuration to Distribution')
  .action(add);

program
  .command('deploy')
  .description('Deploy Canopy Infrastructure to AWS')
  .action(deploy);

program
  .command('destroy')
  .description('Destroy Canopy Infrastructure on AWS')
  .action(destroy);

program
  .command('configure')
  .option('-an, -accountNumber <accountNumber>', 'Configure your account number')
  .option('-dID, -distributionId <distributionId>', 'Configure your CloudFront distribution ID')
  .option('-ak, -accessKeyId <accessKeyId>', 'Configure your AWS access key id')
  .option('-sk, -secretAccessKey <secretAccessKey>', 'Configure your AWS secret access key')
  .option('-r, -region <region>', 'Configure your AWS region')
  .description('Configure your AWS credentials')
  .action(configure);

program
  .command('alert')
  .description('Add pre-configured alerts to your Grafana instance')
  .option('-1, -alert1', 'Add an alert for latency')
  .option('-2, -alert2', 'Add an alert for the cache-hit ratio')
  .option('-3, -alert3', 'Add an alert for bandwidth')
  .option('-4, -alert4', 'Add an alert for the error rate')
  .action(provisionAlert);

program
  .command('launchDashboard')
  .description('Launches Canopy Admin Dashboard')
  .action(launchDashboard);

program.parse(process.argv);