const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const fs = require('fs');
const path = require('path');

class EC2_Backend_Deployment extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'EC2-VPC', {
      maxAzs: 2
    });
    

    // Create a new EC2 instance
    const instance = new ec2.Instance(this, 'Canopy-backend', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
    });

    // Install Docker on the instance
    instance.addUserData(
      `#!/bin/bash
      # Install Docker
      amazon-linux-extras install docker -y
      service docker start
      usermod -a -G docker canopy-user`
    );

    // Configure userdata for the instance
    const dockerComposeFilePath = path.join(__dirname, '../docker-compose.yml');
    const userData = fs.readFileSync(dockerComposeFilePath, 'utf-8');
    instance.addUserData(userData);
  }
}


module.exports = { EC2_Backend_Deployment };
