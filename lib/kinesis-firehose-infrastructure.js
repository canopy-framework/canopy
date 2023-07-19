const { Construct } = require('constructs');
const kinesisfirehose = require('aws-cdk-lib/aws-kinesisfirehose');
const iam = require('aws-cdk-lib/aws-iam');
const AWSConfig = require('../aws-config.json');

class FirehoseInfrastructure extends Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Define IAM role for Firehose
    const firehoseRole = new iam.Role(this, 'firehoseRole', {
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        'allow-kinesis': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kinesis:DescribeStream',
                'kinesis:DescribeStreamSummary',
                'kinesis:GetRecords',
                'kinesis:GetShardIterator',
                'kinesis:ListShards',
                'kinesis:SubscribeToShard'
              ],
              resources: [props.inputStream.streamArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:AbortMultipartUpload',
                's3:GetBucketLocation',
                's3:GetObject',
                's3:ListBucket',
                's3:ListBucketMultipartUploads',
                's3:PutObject',
              ],
              resources: [
                props.bucket.bucketArn,
                props.bucket.bucketArn + '/*'
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:PutLogEvents'
              ],
              resources: [
                props.logGroup.logGroupArn
              ]
            })
          ]
        })
      }
    });

    // Create new Kinesis Data Firehouse delivery stream
    const firehoseStreamToVector = new kinesisfirehose.CfnDeliveryStream(this, 'FirehoseStreamToVector', {
        deliveryStreamName: 'cloudfront-real-time-logs-delivery-stream',
        deliveryStreamType: 'KinesisStreamAsSource',
        kinesisStreamSourceConfiguration: {
          kinesisStreamArn: props.inputStream.streamArn,
          roleArn: firehoseRole.roleArn,
        },
        httpEndpointDestinationConfiguration: {
          endpointConfiguration: {
            name: 'HTTP endpoint',
            url: AWSConfig.httpEndpoint,
          },
          s3Configuration: {
            bucketArn: props.bucket.bucketArn,
            roleArn: firehoseRole.roleArn,
            cloudWatchLoggingOptions: {
              enabled: true,
              logGroupName: '/aws/kinesisfirehose/cloudfront-canopy-deliverystream',
              logStreamName: 'BackupDelivery',
            },
          },
          cloudWatchLoggingOptions: {
            enabled: true,
            logGroupName: '/aws/kinesisfirehose/cloudfront-canopy-deliverystream',
            logStreamName: 'DestinationDelivery',
          },
          bufferingHints: {
            intervalInSeconds: 60, // Default is 300s
            sizeInMBs: 5,
          },
          retryOptions: {
            durationInSeconds: 60,
          },
          requestConfiguration: {
            contentEncoding: 'GZIP',
          },
          roleArn: firehoseRole.roleArn,
        },
        roleArn: firehoseRole.roleArn,
        s3BackupMode: 'FailedDataOnly',
      }
    );
  }
}

module.exports = { FirehoseInfrastructure };
