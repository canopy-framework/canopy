#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { CdkStack } = require('../lib/cdk-stack');
const { SharedResources, VectorAwsStack } = require('../lib/backend-stack');
const { EC2_Backend_Deployment } = require("../lib/ec2-backend-stack");
const AWSConfig = require('../aws-config.json');

const app = new cdk.App();
const env = { account: AWSConfig.accountNumber, region: AWSConfig.region };

new CdkStack(app, 'FirehoseDeliveryStream', { env: env });
// new EC2_Backend_Deployment(app, "EC2-Backend-deployment", { env: env });

// const sharedResources = new SharedResources(app, 'shared-resources', {
//   env: envJason
// });

// new VectorAwsStack(app, 'vector-service', {
//   CLUSTER: sharedResources.cluster,
//   VPC: sharedResources.vpc,
//   env: envJason
// });






