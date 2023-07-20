const gradient = require('gradient-string');
const { canopyLogo } = require('../constants/canopy-logo');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const AWSConfig = require('../../aws-config.json');

const deploy = async () => {
  console.log(gradient.atlas(canopyLogo));
  const deploySpinner = ora({ 
    text: 'Deploying AWS Firehose & AWS EC2 instance (Canopy backend)' 
  }).start();
  
  // Deploying AWS Firehose & Canopy back-end as an EC2 Instance
  try {
    const process = await exec('cdk deploy --all --require-approval never');
    deploySpinner.succeed('Deployment successful.');
  } catch (error) {
    deploySpinner.fail('Deployment failed.');
    console.log(error);
  }

  const configSpinner = ora({ 
    text: 'Attaching real-time log configuration to CloudFront distribution', 
  }).start();

  // Attaching real-time log configuration to given CloudFront distribution
  try {
    await exec('node ./lib/real-time-config.js');
    configSpinner.succeed('Real-time logging enabled for CloudFront distribution');

    // Output EC2 instance IP address
    const ec2Client = new EC2Client(AWSConfig.region);
    const input = {
      InstanceIds: [ 'i-036f240a6818783ca' ],
    };
    const command = new DescribeInstancesCommand(input);
    const instances = await ec2Client.send(command);
    const ec2IpAddress = instances.Reservations[0].Instances[0].PublicIpAddress;

    const steps = 
      [`Your EC2 instance IP address is ${ec2IpAddress}.\n`,
       `Next steps:`,
       `1) Modify the DNS record for the provided HTTP endpoint to ${ec2IpAddress}.`,
       `2) Wait for the DNS changes to propogate. It can take up to 48 hours to propogate worldwide.`,
       `3) Start using Canopy's UI to visualize logs & metrics at http://${ec2IpAddress}:3000.`,
      ].join('\n');

    console.log(steps);
  } catch (error) {
    configSpinner.fail('Real-time log configuration setup failed.');
    console.log(error)
  }
}

module.exports = { deploy };