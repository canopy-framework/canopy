const { Construct } = require('constructs');
const kinesisfirehose = require('aws-cdk-lib/aws-kinesisfirehose');
const { Role, ServicePrincipal } = require('aws-cdk-lib/aws-iam');

class FirehoseInfrastructure extends Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Define IAM role for Firehose
    const firehoseRole = new Role(this, 'firehoseRole', {
      assumedBy: new ServicePrincipal('firehose.amazonaws.com')
    });

    // Grant Firehose read access to data stream
    props.inputStream.grantRead(firehoseRole);
    props.inputStream.grant(firehoseRole, 'kinesis:DescribeStream');

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
            url: 'https://vector.amazingjason.dev' // My Vector HTTP endpoint
          },
          s3Configuration: {
            bucketArn: props.bucket.bucketArn,
            roleArn: firehoseRole.roleArn,
            errorOutputPrefix: 'failed/'
          },
          bufferingHints: {
            intervalInSeconds: 60, // Default is 300s
            sizeInMBs: 5,
          },
        },
        roleArn: firehoseRole.roleArn,
        s3BackupMode: 'FailedDataOnly'
      }
    );
  }
}

module.exports = { FirehoseInfrastructure };
