const { EC2_Backend_Deployment } = require('../lib/ec2-backend-stack');
const { expect, haveResource }   = require('@aws-cdk/assert');
const cdk = require('aws-cdk-lib');
const AWS = require('aws-sdk');
const AWSConfig = require("../src/aws-config");

const app = new cdk.App();
const stack = new EC2_Backend_Deployment(app, 'TestStack');

describe("Test Canopy's backend stack resource deployment", () => {
  test('EC2_Backend_Deployment creates the required resources', () => {  
    expect(stack).to(haveResource('AWS::EC2::Instance'));
    expect(stack).to(haveResource('AWS::EC2::VPC'));
    expect(stack).to(haveResource('AWS::EC2::SecurityGroup'));
    expect(stack).to(haveResource('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        }],
        Version: '2012-10-17',
      },
    }));
  });
  
  // clean up function
  afterAll(async () => {
    try {
      // Delete the CloudFormation stack created by the CDK stack on line 9
      const cloudFormation = new AWS.CloudFormation({ region: AWSConfig.region});
      await cloudFormation.deleteStack({ StackName: stack.stackName }).promise();

    } catch (error) {
      console.error('Error during stack cleanup:', error);
    }
  });
})
