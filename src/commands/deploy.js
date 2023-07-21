const gradient = require('gradient-string');
const { canopyLogo } = require('../constants/canopy-logo');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const AWSConfig = require('../../aws-config.json');
const AWS = require('aws-sdk');

// AWS.config.update(AWSConfig.region);

const deploy = async () => {
  console.log(gradient.atlas(canopyLogo));
  const deploySpinner = ora(`Deploying Canopy's components to AWS Infrastructure`).start();
  
  // Deploy Canopy to AWS Infrastructure
  try {
    await exec('cdk deploy canopy-backend-stack --require-approval never');
    await exec('cdk deploy canopy-frontend-stack --require-approval never');
    deploySpinner.succeed('Deployment successful.');
  } catch (error) {
    deploySpinner.fail('Deployment failed.');
    console.log(error);
  }

  const configSpinner = ora('Attaching real-time log configuration to CloudFront distribution').start();

  // Attach real-time log configuration to CloudFront distribution
  try {
    await exec('node ./lib/real-time-config.js');
    configSpinner.succeed('Real-time logging enabled for CloudFront distribution');
  } catch (error) {
    configSpinner.fail('Real-time log configuration setup failed.');
    console.log(error)
  }

  // Output EC2 instance IP address
  // const ec2Client = new EC2Client(AWSConfig.region);
  // const input = {
  //   InstanceIds: [ 'i-00d7bf41d9728979f' ],
  // };
  // const command = new DescribeInstancesCommand(input);
  // const instances = await ec2Client.send(command);
  // const ec2IpAddress = instances.Reservations[0].Instances[0].PublicIpAddress;
  
  // const output = `Start using Grafana to visualize logs & metrics at http://${ec2IpAddress}:3000.`;
  // console.log(output);

  // One way to access Canopy's backend public IP
  const cloudFormation = new AWS.CloudFormation();
  const stackName = 'canopy-backend-stack';
  const exportName = 'CanopyBackendIP';

  cloudFormation.listExports({ StackName: stackName }, (err, data) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    const exportedValue = data.Exports.find((exportObj) => exportObj.Name === exportName);

    if (exportedValue) {
      const EC2_PUBLIC_IP = exportedValue.Value;
      console.log('EC2_PUBLIC_IP:', EC2_PUBLIC_IP);
    } else {
      console.log(`Export ${exportName} not found.`);
    }
  });
}

module.exports = { deploy };