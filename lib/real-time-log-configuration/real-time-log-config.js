
const { GetDistributionConfigCommand,  UpdateDistributionCommand } = require("@aws-sdk/client-cloudfront");

const { cloudFrontClient, realTimeLogConfig } = require("./cloudfront-config");
const { kinesisClient, streamCommand } = require("./kinesis-config");
const { firehoseClient, firehoseCommand } = require("./firehose-config");

(async function() {
  // Get deployed Kinesis stream's streamARN
  let stream = await kinesisClient.send(streamCommand);
  let streamARN = stream.StreamDescription.StreamARN;
​
  // Get deployed Kinesis stream's roleARN
  let firehose = await firehoseClient.send(firehoseCommand);
  let roleARN = firehose.DeliveryStreamDescription.Source.KinesisStreamSourceDescription.RoleARN;
​
  // Create new real-time logging configuration
  const cloudFrontConfigCommand = realTimeLogConfig(streamARN, roleARN);
  let cloudFrontConfig = await cloudFrontClient.send(cloudFrontConfigCommand);
  console.log(cloudFrontConfig);
​
  // Get current distribution
  const distribution = new GetDistributionConfigCommand({ Id: 'E1WIA5X1GLXHZV' });
  const distConfig = await cloudFrontClient.send(distribution);
  console.log(distConfig);
​
  // Update current distribution
  distConfig.IfMatch = distConfig.ETag;
  delete distConfig.ETag;
  distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn = 'realtimeConfig.RealtimeLogConfig.ARN';
  // const updateConfig = new UpdateDistributionCommand(input);
  console.log(distConfig);
  // client.send(updateConfig);
})();
