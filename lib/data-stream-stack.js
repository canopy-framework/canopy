const { Stack } = require('aws-cdk-lib');
const kinesis = require('aws-cdk-lib/aws-kinesis');
const s3  = require('aws-cdk-lib/aws-s3');
const { FirehoseInfrastructure } = require('./firehose-infrastructure');

// A stack represents a bundle of AWS resources contained for a single deployment
// Synthesizing the stack generates a CloudFormation template to deploy on AWS Cloud
// Below we define a stack for deploying a data stream originating from an existing
// CloudFront distribution to Vector
class DataStreamStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.templateOptions.description = 'Deploy data stream from CloudFront to Vector';

    // Create a backup s3 bucket for failed logs
    const bucket = new s3.Bucket(this, 'failed-logs-bucket', {
      versioned: true
    });

    // Create a new Kinesis Data stream
    const stream = new kinesis.Stream(this, 'input-stream', {
      streamName: 'cloudfront-real-time-logs-stream',
      streamMode: kinesis.StreamMode.ON_DEMAND // Auto-scaled throughput
    });

    // Create a new Kinesis Firehose delivery stream
    new FirehoseInfrastructure(this, 'firehose-infrastructure', {
      bucket: bucket,
      inputStream: stream
    });
  }
}

module.exports = { DataStreamStack }
