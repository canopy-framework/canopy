const inquirer = require('inquirer');
const ora = require('ora-classic');
const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const { CloudFrontClient, GetDistributionConfigCommand, UpdateDistributionCommand, DeleteRealtimeLogConfigCommand } = require("@aws-sdk/client-cloudfront");
const iam = require("@aws-sdk/client-iam");
const AWSConfig = require('../../aws-config.json');

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
  
  // Delete Canopy's AWS Infrastructure
  try {
    await exec('cdk destroy canopy-frontend-stack --force');
    await exec('cdk destroy canopy-backend-stack --force');
    destroySpinner.succeed('Canopy AWS Infrastructure successfully deleted.');
  } catch (error) {
    destroySpinner.fail('Deleting Canopy AWS Infrastructure failed.');
    console.log(error);
  }

  const configSpinner = ora({ text: `Deleting Real-Time Log Configuration`}).start();

  try {
    // Get current distribution
    const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
    const distribution = new GetDistributionConfigCommand({ Id: AWSConfig.distributionId });
    const distConfig = await cloudFrontClient.send(distribution);
    
    // Update distribution to remove real-time log configuration from cache behavior
    distConfig.Id = AWSConfig.distributionId;
    distConfig.IfMatch = distConfig.ETag;
    delete distConfig.ETag;
    const realtimeConfigARN = distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn;
    delete distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn;
    const updateConfigCommand = new UpdateDistributionCommand(distConfig);
    await cloudFrontClient.send(updateConfigCommand);

    // Delete real-time log configuration
    const configInput = { ARN: realtimeConfigARN };
    const deleteCommand = new DeleteRealtimeLogConfigCommand(configInput);
    await cloudFrontClient.send(deleteCommand);

    // Delete IAM role policy
    const iamClient = new iam.IAMClient(AWSConfig.region);
    const policyInput = {
      RoleName: 'CloudFrontRealtimeLogConfigRole-Canopy', 
      PolicyName: 'CloudFrontRealtimeLogConfigRole-Canopy',
    };
    const deletePolicyCommand = new iam.DeleteRolePolicyCommand(policyInput);
    await iamClient.send(deletePolicyCommand);

    // Delete IAM role
    const roleInput = {
      RoleName: 'CloudFrontRealtimeLogConfigRole-Canopy',
    }
    const deleteRoleCommand = new iam.DeleteRoleCommand(roleInput);
    await iamClient.send(deleteRoleCommand);

    configSpinner.succeed('Real-time log configuration successfully deleted.');
  } catch(error) {
    configSpinner.fail('Deleting real-time log configuration failed.');
    console.log(error);
  }
}

module.exports = { destroy };