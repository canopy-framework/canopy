#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { DataStreamStack } = require('../lib/data-stream-stack');
const { SharedResources, VectorAwsStack } = require('../lib/backend-stack');

const app = new cdk.App();
const envJason = { account: '126159759664', region: 'us-east-2' };

// new DataStreamStack(app, 'firehose-delivery-stream', {
  // Deploys stack to Account & Region implied by current CLI config
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  // Deploys stack to specific Account and Region
  // env: envJason
//});

// Deploys shared backend resources: VPC, ECS cluster
const sharedResources = new SharedResources(app, 'shared-resources', {
  env: envJason
});

// Deploys Vector service
new VectorAwsStack(app, 'vector-service', {
  CLUSTER: sharedResources.cluster,
  VPC: sharedResources.vpc,
  env: envJason
});






