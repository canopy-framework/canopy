const inquirer = require('inquirer');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const AWSConfig = require('../../aws-config.json')
const { 
  CloudFrontClient,
  GetDistributionConfigCommand,
  UpdateDistributionCommand,
  DeleteRealtimeLogConfigCommand, 
} = require("@aws-sdk/client-cloudfront");

async function confirmDeletion() {
  const question = {
    name: 'delete',
    message: "Are you sure you want to delete Canopy's AWS infrastructure? Type 'yes' to confirm:"
  }

  const answer = await inquirer.prompt(question);
  return answer.delete;
}

const destroy = async () => {
  const answer = await confirmDeletion();
  if (answer !== 'yes') return;

  const destroySpinner = ora({ text: `Deleting Canopy's AWS Infrastucture`}).start();
  
  // Delete Kinesis data stream, Firehose, S3 bucket, log groups, EC2 instance
  try {
    await exec('cdk destroy --all --force');
    destroySpinner.succeed('Canopy AWS Infrastructure successfully deleted.');
  } catch (error) {
    destroySpinner.fail('Deletion failed.');
    console.log(error);
  }

  const configSpinner = ora({ text: `Deleting Real-Time Log Configuration`}).start();

  try {
    // Get current distribution
    const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
    const distribution = new GetDistributionConfigCommand({ Id: AWSConfig.distributionId });
    const distConfig = await cloudFrontClient.send(distribution);
    
    // Update current distribution to remove real-time log configuration from cache behavior
    distConfig.Id = AWSConfig.distributionId;
    distConfig.IfMatch = distConfig.ETag;
    delete distConfig.ETag;
    const realtimeConfigARN = distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn;
    delete distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn;
    const updateConfigCommand = new UpdateDistributionCommand(distConfig);
    await cloudFrontClient.send(updateConfigCommand);

    // Delete real-time log configuration
    const input = { ARN: realtimeConfigARN };
    const deleteCommand = new DeleteRealtimeLogConfigCommand(input);
    await cloudFrontClient.send(deleteCommand);
    configSpinner.succeed('Real-time log configuration successfully deleted.');
  } catch(error) {
    configSpinner.fail('Deletion failed.');
    console.log(error);
  }
}

module.exports = { destroy };