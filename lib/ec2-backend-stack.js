const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const assets = require('aws-cdk-lib/aws-s3-assets');
const { KeyPair } = require('cdk-ec2-key-pair');
const fs = require('fs');
const path = require('path');


class EC2_Backend_Deployment extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'EC2-VPC', {
      cidr: '10.0.0.0/16', 
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 20,
        },
      ],
    });

    // 👇 create Security Group for the Instance
    const EC2_SG = new ec2.SecurityGroup(this, 'EC2-SG', {
      vpc,
      allowAllOutbound: true,
     });

     EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );

    EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );

    EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8383),
      'allow traffic from anywhere to Vector container',
    );

    EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      'allow traffic from anywhere to Grafana container',
    );

    EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8123),
      'allow traffic from anywhere to Clickhouse container',
    );

    EC2_SG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(9000),
      'allow traffic from anywhere to Clickhouse container terminal',
    );

    // 👇 create a Role for the EC2 Instance
    const EC2_Role = new iam.Role(this, 'EC2-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        ],
      });

    // Create the Key Pair
    const key = new KeyPair(this, 'EC2-Authentication-Key-Pair', {
      name: 'EC2-key-pair',
      description: 'This is a Key Pair',
      storePublicKey: true, // by default the public key will not be stored in Secrets Manager
    });
    
    // Grant read access to the private key to the role assigned to the EC2 instance
    key.grantReadOnPrivateKey(EC2_Role)

    // Grant read access to the public key to the role assigned to the EC2 instance
    key.grantReadOnPublicKey(EC2_Role)

    // Include docker-compose.yml file in the deployment package
    const dockerComposeFilePath = path.join(__dirname, '../docker-compose.yml');
    const dockerComposeAsset = new assets.Asset(this, 'DockerComposeAsset', {
      path: dockerComposeFilePath,
    });

    // Include NGINX config, SSL certificate & private key files in deployment package
    const nginxConfigFilePath = path.join(__dirname, '../nginx.conf');
    const sslCertFilePath = path.join(__dirname, '../fullchain.pem');
    const privateKeyFilePath = path.join(__dirname, '../privkey.pem');

    const nginxConfigAsset = new assets.Asset(this, 'NGINXConfigAsset', {
      path: nginxConfigFilePath,
    });

    const sslCertAsset = new assets.Asset(this, 'sslCertAsset', {
      path: sslCertFilePath,
    });

    const privateKeyAsset = new assets.Asset(this, 'privateKeyAsset', {
      path: privateKeyFilePath,
    });

    // Grant read access to the docker-compose file to the role assigned to the EC2 instance
    dockerComposeAsset.grantRead(EC2_Role);

    // Create a new EC2 instance
    const instance = new ec2.Instance(this, 'Canopy-backend', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: EC2_Role,
      securityGroup: EC2_SG,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      keyName: key.keyPairName,
    });

    // Install Docker and Docker Compose on the instance
    instance.addUserData(`
    # Install Docker
    amazon-linux-extras install docker -y
    service docker start
    usermod -a -G docker ec2-user

    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # testing that docker engine works on EC2 instance
    docker run hello-world

    # Create directory for docker-compose.yml
    sudo mkdir ~/canopy-backend

    # Copy docker-compose.yml from deployment package
    aws s3 cp ${dockerComposeAsset.s3ObjectUrl} ~/canopy-backend

    # Run docker-compose up
    cd ~/canopy-backend
    mv *.yml docker-compose.yml
    docker-compose up -d

    # Install NGINX
    sudo amazon-linux-extras install -y nginx1

    # Copy NGINX config, SSL certificate & private key files in deployment package
    aws s3 cp ${nginxConfigAsset.s3ObjectUrl} /etc/nginx/nginx.conf
    sudo mkdir -p /etc/ssl/live/vector
    aws s3 cp ${sslCertAsset.s3ObjectUrl} /etc/ssl/live/vector/fullchain.pem
    aws s3 cp ${privateKeyAsset.s3ObjectUrl} /etc/ssl/live/vector/privkey.pem

    # Start & enable auto-start of NGINX
    sudo systemctl start nginx
    sudo systemctl enable nginx
  `);
  }
}


module.exports = { EC2_Backend_Deployment };
