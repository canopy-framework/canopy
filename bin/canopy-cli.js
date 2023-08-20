#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const path = require('path');
const { RealTimeLogsPipeline } = require(path.join(__dirname, "../lib/realtime_logs_pipeline"));
// const { RealTimeLogsPipeline }   = require('../lib/realtime_logs_pipeline');
const { EC2_Backend_Deployment } = require(path.join(__dirname, "../lib/ec2-backend-stack"));
const AWSConfig = require(path.join(__dirname, '../aws-config.json'));

const app = new cdk.App();
const env = { account: AWSConfig.accountNumber, region: AWSConfig.region };

new RealTimeLogsPipeline(app, 'canopy-frontend-stack', { env: env });
new EC2_Backend_Deployment(app, "canopy-backend-stack", { env: env });






