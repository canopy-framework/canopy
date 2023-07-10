const { Stack, Duration } = require('aws-cdk-lib');
const kinesis = require('aws-cdk-lib/aws-kinesis');
const s3  = require('aws-cdk-lib/aws-s3');
const { FirehoseInfrastructure } = require('./kinesis-firehose-infrastructure');

class CdkStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.templateOptions.description = 'Create logging pipeline from CloudFront to Vector';

    // Create a new s3 bucket
    const bucket = new s3.Bucket(this, 'Bucket', {
      versioned: true
    });

    // Create a new Kinesis Data stream
    const stream = new kinesis.Stream(this, 'InputStream', {
      streamName: 'cloudfront-real-time-logs-data-stream',
      streamMode: kinesis.StreamMode.ON_DEMAND
    });

    // Create a new Kinesis Firehose delivery stream
    new FirehoseInfrastructure(this, 'FirehoseInfrastructure', {
      bucket: bucket,
      inputStream: stream
    });
  }
}

module.exports = { CdkStack }
