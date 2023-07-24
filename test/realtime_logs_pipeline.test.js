const { RealTimeLogsPipeline } = require('../lib/realtime_logs_pipeline');
const { expect, haveResource } = require('@aws-cdk/assert');
const cdk = require('aws-cdk-lib');
const AWS = require('aws-sdk');
const AWSConfig = require("../src/aws-config");

const app = new cdk.App();
const stack = new RealTimeLogsPipeline(app, 'TestStack');

// clean up function
afterAll(async () => {
  try {
    // Delete the CloudFormation stack created by the CDK stack on line 8
    const cloudFormation = new AWS.CloudFormation({ region: AWSConfig.region});
    await cloudFormation.deleteStack({ StackName: stack.stackName }).promise();

  } catch (error) {
    console.error('Error during stack cleanup:', error);
  }
});

describe("Test Canopy's frontend stack resource deployment", () => {
  test('should create all AWS resources with correct properties', () => {
    expect(stack).to(haveResource('AWS::Kinesis::Stream', {
      Name: 'cloudfront-real-time-logs-data-stream',
    }));

    expect(stack).to(haveResource('AWS::SQS::Queue', {
      QueueName: 'failed-logs-queue',
    }));

    expect(stack).to(haveResource('AWS::S3::Bucket', {
      BucketName: 'failed-logs-bucket',
    }));

    expect(stack).to(haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
        Version: '2012-10-17',
      },
      ManagedPolicyArns: [
        { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole']] },
      ],
    }));
  });
});
