#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { RealTimeLogsPipeline }   = require('../lib/realtime_logs_pipeline');
const { EC2_Backend_Deployment } = require("../lib/ec2-backend-stack");
const AWSConfig = require('../aws-config.json');

// const { SharedResources, VectorAwsStack } = require('../lib/backend-stack');

const app = new cdk.App();
const env = { account: AWSConfig.accountNumber, region: AWSConfig.region };

new RealTimeLogsPipeline(app, 'Canopy frontend stack', { env: env });
new EC2_Backend_Deployment(app, "Canopy backend stack", { env: env });

// const sharedResources = new SharedResources(app, 'shared-resources', {
//   env: envJason
// });

// new VectorAwsStack(app, 'vector-service', {
//   CLUSTER: sharedResources.cluster,
//   VPC: sharedResources.vpc,
//   env: envJason
// });






