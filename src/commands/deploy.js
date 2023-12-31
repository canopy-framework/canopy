const gradient = require('gradient-string');
const path = require('path');
const { canopyLogo } = require(path.join(__dirname, '../constants/canopy-logo'));
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);

const AWSConfig = require(path.join(__dirname, '../../aws-config.json'));
const { CloudFrontClient, GetRealtimeLogConfigCommand } = require('@aws-sdk/client-cloudfront');
const AWS = require('aws-sdk');
const fs = require('fs');
const { saveDistribution } = require(path.join(__dirname, "../../canopy-admin-dashboard/api/src/database/crud"));

const deploy = async () => {
  console.log(gradient.atlas(canopyLogo));
  const deploySpinner = ora(`Deploying Canopy's components to AWS Infrastructure`).start();
  
  // Deploy Canopy to AWS Infrastructure
  try {
    const appPath = path.join(__dirname, "../../bin/canopy-cli.js");
    await exec(`cdk deploy --app "node ${appPath}" canopy-backend-stack --require-approval never`);
    await exec(`cdk deploy --app "node ${appPath}" canopy-frontend-stack --require-approval never`);
    deploySpinner.succeed('Deployment successful.');
  } catch (error) {
    deploySpinner.fail('Deployment failed.');
    console.log(error);
  }

  const configSpinner = ora('Attaching real-time log configuration to CloudFront distribution').start();

  // Attach real-time log configuration to CloudFront distribution
  try {
    await exec(`node ${path.join(__dirname, '/../../lib/real-time-config.js')}`);
    configSpinner.succeed('Real-time logging enabled for CloudFront distribution');
  } catch (error) {
    configSpinner.fail('Real-time log configuration setup failed.');
    console.log(error)
  }

  // Add distribution to DB
  try {
    // Get real-time log configuration
    const cloudFrontClient = new CloudFrontClient({ region: AWSConfig.region });
    const getConfigCommand = new GetRealtimeLogConfigCommand({
      Name: 'real-time-log-configuration',
    });
    const realtimeConfig = await cloudFrontClient.send(getConfigCommand);
    
    await saveDistribution(AWSConfig.distributionId, JSON.stringify(realtimeConfig.RealtimeLogConfig))
  } catch (error) {
    console.log(error);
  }

  // Output Canopy's backend public IP
  const cloudFormation = new AWS.CloudFormation({ region: AWSConfig.region });
  const exportName = 'CanopyBackendIP';

  cloudFormation.listExports((err, data) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    const exportedValue = data.Exports.find((exportObj) => exportObj.Name === exportName);

    if (exportedValue) {
      const EC2_PUBLIC_IP = exportedValue.Value;
      console.log(`Visualize logs and metrics via the Grafana UI at http://${EC2_PUBLIC_IP}:3000`);
      
      // Write to Grafana Configuration File
      const grafanaConfigPath = path.join(__dirname, '..', 'constants', "grafana-config.json");
      const jsonData = fs.readFileSync(grafanaConfigPath);
      const configData = JSON.parse(jsonData);
      configData["host"] = EC2_PUBLIC_IP;
      fs.writeFileSync(grafanaConfigPath, JSON.stringify(configData, null, 2));
    } else {
      console.log(`Export ${exportName} not found.`);
    }
  });
}

module.exports = { deploy };