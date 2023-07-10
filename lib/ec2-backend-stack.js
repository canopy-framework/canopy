const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const fs = require('fs');
const path = require('path');

class EC2_Backend_Deployment extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'EC2-VPC', {
      cidr: '10.0.0.0/16', 
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 20,
        },
      ],
    });
    

    // Create a new EC2 instance
    const instance = new ec2.Instance(this, 'Canopy-backend', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
    });

    // Expose EC2 instance to the internet
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

     // Include docker-compose.yml file in the deployment package
     const dockerComposeFilePath = path.join(__dirname, '../docker-compose.yml');
     this.addAsset('DockerComposeFile', {
       path: dockerComposeFilePath,
     });

    // Install Docker and Docker Compose on the instance
    instance.addUserData(`
    # Install Docker
    amazon-linux-extras install docker -y
    service docker start
    usermod -a -G docker canopy-user

    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Copy docker-compose.yml from deployment package
    cp /asset-input/docker-compose.yml /canopy-backend

    # Run docker-compose up
    cd /canopy-backend
    docker-compose up -d
  `);
  }
}


module.exports = { EC2_Backend_Deployment };
