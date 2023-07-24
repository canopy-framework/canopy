const fs = require('fs');
const inquirer = require('inquirer');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const validations = require("../utils/user-input-validation");
const { CloudFrontClient, GetRealtimeLogConfigCommand, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const add = async (options) => {
  let answer = options;

  // Prompt user if add was called without options
  if (!answer.DistributionId) {
    const question = {
      name: 'distributionId',
      message: 'Please enter the ID of the CloudFront distribution to attach your real-time log configuration to:',
      validate: validations.isValidCloudFrontDistributionID,
    };
  
    answer = await inquirer.prompt(question);
  } else {
    answer.distributionId = answer.DistributionId;
  }

  // Get real-time log configuration ARN
  const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
  const getConfigCommand = new GetRealtimeLogConfigCommand({
    Name: 'real-time-log-configuration',
  });
  const realtimeConfig = await cloudFrontClient.send(getConfigCommand);
  // console.log(realtimeConfig);
  const realtimeConfigARN = realtimeConfig.RealtimeLogConfig.ARN;

  // Write distribution ID & real-time configuration to JSON file
  const jsonString = fs.readFileSync('./cloudfront-distributions.json');
  const distributions = JSON.parse(jsonString);
  distributions.push({ 
    distributionId: answer.distributionId,
    realtimeConfig: realtimeConfig.RealtimeLogConfig,
  });
  fs.writeFileSync('./cloudfront-distributions.json', JSON.stringify(distributions, null, 2));

  // Get current distribution
  const distribution = new GetDistributionConfigCommand({ Id: answer.distributionId });
  const distConfig = await cloudFrontClient.send(distribution);

  // Update current distribution
  distConfig.Id = answer.distributionId;
  distConfig.IfMatch = distConfig.ETag;
  delete distConfig.ETag;
  distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn = realtimeConfigARN;
  const updateConfigCommand = new UpdateDistributionCommand(distConfig);
  cloudFrontClient.send(updateConfigCommand);
};

module.exports = { add };