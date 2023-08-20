const path = require('path');
const inquirer = require('inquirer');
const ora = require('ora-classic');
const validations = require(path.join(__dirname, "../utils/user-input-validation"));
const AWSConfig = require(path.join(__dirname, '../../aws-config.json'));
const { CloudFrontClient, GetRealtimeLogConfigCommand, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
const { saveDistribution } = require(path.join(__dirname, "../../canopy-admin-dashboard/api/src/database/crud"));

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
  const cloudFrontClient = new CloudFrontClient({ region: AWSConfig.region });
  const getConfigCommand = new GetRealtimeLogConfigCommand({
    Name: 'real-time-log-configuration',
  });
  const realtimeConfig = await cloudFrontClient.send(getConfigCommand);
  const realtimeConfigARN = realtimeConfig.RealtimeLogConfig.ARN;

  const configSpinner = ora('Attaching real-time log configuration to CloudFront distribution').start();
  
  try {
    // Get current distribution
    const distribution = new GetDistributionConfigCommand({ Id: answer.distributionId });
    const distConfig = await cloudFrontClient.send(distribution);

    // Attach real-time log configuration to distribution
    distConfig.Id = answer.distributionId;
    distConfig.IfMatch = distConfig.ETag;
    delete distConfig.ETag;
    distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn = realtimeConfigARN;
    const updateConfigCommand = new UpdateDistributionCommand(distConfig);
    await cloudFrontClient.send(updateConfigCommand);
    configSpinner.succeed('Real-time logging enabled for CloudFront distribution');
  } catch (error) {
    configSpinner.fail('Real-time log configuration setup failed.');
    console.log(error)
  }

  // Add distribution info to DB
  await saveDistribution(answer.distributionId, JSON.stringify(realtimeConfig.RealtimeLogConfig));
};

module.exports = { add };