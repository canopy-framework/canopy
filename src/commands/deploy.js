const gradient = require('gradient-string');
const { canopyLogo } = require('../constants/canopy-logo');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);

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
  } catch (error) {
    configSpinner.fail('Real-time log configuration setup failed.');
    console.log(error);
  }
}

module.exports = { deploy };