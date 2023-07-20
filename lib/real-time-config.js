const { KinesisClient, DescribeStreamCommand } = require('@aws-sdk/client-kinesis');
const { 
  CloudFrontClient, 
  CreateRealtimeLogConfigCommand, 
  GetDistributionConfigCommand,
  UpdateDistributionCommand 
} = require('@aws-sdk/client-cloudfront');
const iam = require('@aws-sdk/client-iam');
const AWSConfig = require('../aws-config.json');

const config = { region: AWSConfig.region };

// Generate command for API call that gets Kinesis stream details 
const kinesisClient = new KinesisClient(config);
const streamInput = { StreamName: 'cloudfront-real-time-logs-data-stream' };
const streamCommand = new DescribeStreamCommand(streamInput);

// Generate function for creating IAM role
const iamClient = new iam.IAMClient(config);

const createRole = async (roleName) => {
  const roleCommand = new iam.CreateRoleCommand({
    AssumeRolePolicyDocument: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "cloudfront.amazonaws.com" },
          Action: "sts:AssumeRole",
          "Condition": {
            "StringEquals": { "aws:SourceAccount": AWSConfig.accountNumber },
          }
        },
      ],
    }),
    RoleName: roleName,
  });

  return await iamClient.send(roleCommand);
};

// Generate function for attaching permissions policy to IAM role
const putRolePolicy = async (roleName, policyName, policyDocument) => {
  const command = new iam.PutRolePolicyCommand({
    RoleName: roleName,
    PolicyName: policyName,
    PolicyDocument: policyDocument,
  });

  await iamClient.send(command);
};

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
      'asn',
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

  // Create IAM role
  const iamRole = await createRole('CloudFrontRealtimeLogConfigRole-Canopy', streamARN);
  const roleARN = iamRole.Role.Arn;

  // Attach permissions policy for data stream to IAM role
  const policyDocument = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        "Effect": "Allow",
        "Action": [
          "kinesis:DescribeStreamSummary",
          "kinesis:DescribeStream",
          "kinesis:ListStreams",
          "kinesis:PutRecord",
          "kinesis:PutRecords",
        ],
        "Resource": [
          streamARN,
        ]
      }
    ],
  });

  putRolePolicy('CloudFrontRealtimeLogConfigRole-Canopy', 'CloudFrontRealtimeLogConfigRole-Canopy', policyDocument);

  // Create new real-time logging configuration
  const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
  const getConfigCommand = generateCommand(streamARN, roleARN);
  let cloudFrontConfig = await cloudFrontClient.send(getConfigCommand);
  let realtimeConfigARN = cloudFrontConfig.RealtimeLogConfig.ARN;
  // console.log(cloudFrontConfig);

  // Get current distribution
  const distribution = new GetDistributionConfigCommand({ Id: AWSConfig.distributionId });
  const distConfig = await cloudFrontClient.send(distribution);
  //console.log(distConfig.DistributionConfig.Origins.Items);

  // Update current distribution
  distConfig.Id = AWSConfig.distributionId;
  distConfig.IfMatch = distConfig.ETag;
  delete distConfig.ETag;
  distConfig.DistributionConfig.DefaultCacheBehavior.RealtimeLogConfigArn = realtimeConfigARN;
  //console.log(distConfig);
  const updateConfigCommand = new UpdateDistributionCommand(distConfig);
  cloudFrontClient.send(updateConfigCommand);
})();