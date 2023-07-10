const { KinesisClient, DescribeStreamCommand } = require('@aws-sdk/client-kinesis');
const { FirehoseClient, DescribeDeliveryStreamCommand } = require('@aws-sdk/client-firehose');
const { 
  CloudFrontClient, 
  CreateRealtimeLogConfigCommand, 
  GetDistributionConfigCommand,
  UpdateDistributionCommand 
} = require('@aws-sdk/client-cloudfront');

const config = { region: 'us-east-2' };

// Generate command for API call that gets Kinesis stream details 
const kinesisClient = new KinesisClient(config);
const streamInput = { StreamName: 'cloudfront-real-time-logs-data-stream' };
const streamCommand = new DescribeStreamCommand(streamInput);

// Generate command for API call that gets Firehose stream details
const firehoseClient = new FirehoseClient(config);
const firehoseInput = { DeliveryStreamName: 'cloudfront-real-time-logs-delivery-stream' };
const firehoseCommand = new DescribeDeliveryStreamCommand(firehoseInput);

// Generate command for API call that creates new real-time logging configuration
const generateCommand = (streamARN, roleARN) => {
  const input = { 
    EndPoints: [ 
      { 
        StreamType: 'Kinesis',
        KinesisStreamConfig: {
          RoleARN: roleARN, 
          StreamARN: streamARN,
        },
      },
    ],
    Fields: [
      'timestamp',
      'c-ip', 
      'time-to-first-byte', 
      'sc-status', 
      'sc-bytes', 
      'cs-method', 
      'cs-protocol', 
      'cs-host', 
      'cs-uri-stem', 
      'cs-bytes',
      'x-edge-location', 
      'x-edge-request-id', 
      'x-host-header', 
      'time-taken', 
      'cs-protocol-version',
      'c-ip-version', 
      'cs-user-agent', 
      'cs-referer', 
      'cs-cookie',
      'cs-uri-query',
      'x-edge-response-result-type', 
      'x-forwarded-for', 
      'ssl-protocol', 
      'ssl-cipher',
      'x-edge-result-type', 
      'fle-encrypted-fields', 
      'fle-status', 
      'sc-content-type',
      'sc-content-len', 
      'sc-range-start', 
      'sc-range-end', 
      'c-port', 
      'x-edge-detailed-result-type',
      'c-country', 
      'cs-accept-encoding', 
      'cs-accept',
      'cache-behavior-path-pattern', 
      'cs-headers', 
      'cs-header-names', 
      'cs-headers-count', 
      'origin-fbl', 
      'origin-lbl', 
      'asn'
    ],
    Name: 'real-time-log-configuration',
    SamplingRate: 100
  };
  
  return new CreateRealtimeLogConfigCommand(input);
}

(async function() {
  // Get deployed Kinesis stream's streamARN
  let stream = await kinesisClient.send(streamCommand);
  let streamARN = stream.StreamDescription.StreamARN;
  //console.log(streamARN);

  // Get deployed Kinesis stream's roleARN
  let firehose = await firehoseClient.send(firehoseCommand);
  let roleARN = firehose.DeliveryStreamDescription.Source.KinesisStreamSourceDescription.RoleARN;
  //console.log(roleARN);

  // Create new real-time logging configuration
  const cloudFrontClient = new CloudFrontClient(config);
  const getConfigCommand = generateCommand(streamARN, roleARN);
  let cloudFrontConfig = await cloudFrontClient.send(getConfigCommand);
  let realtimeConfigARN = cloudFrontConfig.RealtimeLogConfig.ARN;
  // console.log(cloudFrontConfig);

  // Get current distribution
  const distribution = new GetDistributionConfigCommand({ Id: 'E1WIA5X1GLXHZV' });
  const distConfig = await cloudFrontClient.send(distribution);
  //console.log(distConfig.DistributionConfig.Origins.Items);

  // Update current distribution
  distConfig.Id = 'E1WIA5X1GLXHZV';
  distConfig.IfMatch = distConfig.ETag;
  delete distConfig.ETag;
  distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn = realtimeConfigARN;
  // console.log(distConfig);
  const updateConfigCommand = new UpdateDistributionCommand(distConfig);
  cloudFrontClient.send(updateConfigCommand);
})();