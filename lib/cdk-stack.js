const { Stack, Duration } = require('aws-cdk-lib');
// const sqs = require('aws-cdk-lib/aws-sqs');

class CdkStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    this.templateOptions.description = 'Create logging pipeline from CloudFront to Vector';

    // Create a new Kinesis Data stream
    const stream = new kinesis.Stream(this, 'InputStream', {
      streamName: 'cloudfront-real-time-logs-stream',
      streamMode: kinesis.StreamMode.ON_DEMAND
    });
  }
}

module.exports = { CanopyCliStack }
