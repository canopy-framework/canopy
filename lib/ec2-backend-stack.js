const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const fs = require('fs');
const path = require('path');

class EC2_Backend_Deployment extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'EC2-VPC', {
      cidr: '10.0.0.0/16', // Update the VPC CIDR block
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 20, // Update the CIDR mask to allocate a smaller range
        },
      ],
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

    // Expose EC2 instance to the internet
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
  }
}


module.exports = { EC2_Backend_Deployment };
