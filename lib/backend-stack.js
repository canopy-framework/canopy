const { Stack } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ecs = require('aws-cdk-lib/aws-ecs');

// Stack that contains all shared resources
class SharedResources extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create network for running back-end
    this.vpc = ec2.Vpc(this, 'canopy-vpc', {
      maxAzs: 2 // Default is all AZs in region
    });

    // Create an ECS cluster
    this.cluster = new ecs.Cluster(this, 'canopy-cluster',{
      vpc: this.vpc
    });
  }
}

