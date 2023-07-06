#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { CdkStack } = require('../lib/cdk-stack');
const { SharedResources, VectorAwsStack } = require('../lib/backend-stack');

const app = new cdk.App();
const envJason = { account: '126159759664', region: 'us-east-2' };

// new CdkStack(app, 'FirehoseDeliveryStream', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: envJason

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
//});

const sharedResources = new SharedResources(app, 'shared-resources', {
  env: envJason
});

new VectorAwsStack(app, 'vector-service', {
  CLUSTER: sharedResources.cluster,
  VPC: sharedResources.vpc,
  env: envJason
});

// new BackendStack(app, 'BackendStack', {
//   env: envJason
// });






