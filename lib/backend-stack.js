const { Stack } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ecs = require('aws-cdk-lib/aws-ecs');
const ecs_patterns = require('aws-cdk-lib/aws-ecs-patterns');
const efs = require('aws-cdk-lib/aws-efs');
const iam =  require('aws-cdk-lib/aws-iam');
const { PrivateDnsNamespace, DnsRecordType } = require('aws-cdk-lib/aws-servicediscovery');
const { RetentionDays } = require('aws-cdk-lib/aws-logs');

// Stack that contains all shared resources
class SharedResources extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Creates logically isolated virtual network for launching AWS resources
    this.vpc = new ec2.Vpc(this, 'canopy-vpc', {
      maxAzs: 2 // Minimum count is 2; Default is all AZs in region
    });

    // Creates an ECS cluster within VPC
    this.cluster = new ecs.Cluster(this, 'canopy-cluster', {
      vpc: this.vpc
    });
  }
}

// Deploy Vector to AWS
class VectorAwsStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const { CLUSTER, VPC } = props;
    const namespace = 'service.local';

    // Defines a service discovery HTTP namespace
    const dnsNamespace = new PrivateDnsNamespace(
      this,
      "dnsNamespace",
      {
        name: namespace,
        vpc: VPC,
        description: "Private DnsNamespace for Services",
      }
    );

    // Defines a task that will be passed to function that creates Vector service
    // Defines how much CPU and memory the service can utilize
    const vectorTask = new ecs.FargateTaskDefinition(
      this, 'vectorTask', {
        cpu: 1024,
        memoryLimitMiB: 2048
      }
    );
    
    // EFS (Elastic File System) is used to persist data (like Docker volumes)
    // Define EFS data access permissions for AWS root account
    const efsMountPolicy = new iam.PolicyDocument({
      statements: [new iam.PolicyStatement({
        actions: [
          'elasticfilesystem:ClientWrite',
          'elasticfilesystem:ClientMount',
          'elasticfilesystem:ClientRootAccess'
        ],
        principals: [new iam.AnyPrincipal()], // Change later
        resources: ['*'],
        conditions: {
          Bool: {
            'elasticfilesystem:AccessedViaMountTarget': 'true',
          },
        },
      })],
    });

    const efsSecurityGroup = new ec2.SecurityGroup(this, "efs-security-group", {
      securityGroupName: `efs-security-group`,
      vpc: VPC,
    });

    // Needed so that Fargate task can connect to EFS FileSystem
    efsSecurityGroup.addIngressRule(
      efsSecurityGroup,
      ec2.Port.tcp(2049) 
    );
    
    // Creates new EFS for persisting data
    const fileSystem = new efs.FileSystem(this, "EfsFileSystem", { 
      vpc: VPC,
      encrypted: true,
      fileSystemPolicy: efsMountPolicy,
      securityGroup: efsSecurityGroup
     });
    

    // Create access point from EFS
    const efsAccessPoint = new efs.AccessPoint(this, "volumeAccessPoint",  {
      fileSystem: fileSystem,
      path: "/data",
      createAcl: {
       ownerGid: "1000",
       ownerUid: "1000",
       permissions: "755"
      },
      posixUser: {
       uid: "1000",
       gid: "1000"
      }
   }) 
    
    // Define configuration for EFS volume
    const volume = {
      name: 'vector-data',
      efsVolumeConfiguration: {
        authorizationConfig: {
          accessPointId: efsAccessPoint.accessPointId,
          iam: 'ENABLED',
        },      
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
      }
    };

    // Add EFS volume to task definition
    vectorTask.addVolume(volume);

    // Retrieve Docker container & attach logging construct to it
    const vectorContainer = vectorTask.addContainer('vector', {
      containerName: 'vector',
      image: ecs.ContainerImage.fromRegistry('amazingjason/canopy-vector'), // Grabs DockerHub image
      essential: true,
      logging: new ecs.AwsLogDriver({
          streamPrefix: 'vectorService',
          logRetention: RetentionDays.ONE_WEEK,
      })
    });

    // Mount the volume so container has access to volume to persist data in specified path
    vectorContainer.addMountPoints({
      containerPath: '/var/lib/vector',
      sourceVolume: 'vector-data',
      readOnly: false,
    });

    // Declare ports for container
    vectorContainer.addPortMappings({
      hostPort: 8383,
      containerPort:8383,
    });

    // Define security group for Vector service 
    const vectorSecurityGroup = new ec2.SecurityGroup(
      this,
      'vectorServiceSecurityGroup',
      {
        allowAllOutbound: true,
        securityGroupName: `vectorServiceSecurityGroup`,
        vpc: VPC,
      }
    );

    // Allow connections from the peer on the given port
    vectorSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(8383));

    // Creates a Fargate service for Vector fronted by a Network Load Balancer
    // Implements service discovery, executes task definition, adds a port listener
    const vectorService = new ecs_patterns.NetworkLoadBalancedFargateService(
      this, 'vectorService', {
        serviceName: 'vector',
        cluster: CLUSTER,
        cloudMapOptions: {
          name: 'vector',
          cloudMapNamespace: dnsNamespace,
          dnsRecordType: DnsRecordType.A,
        },
        desiredCount: 1, // Desired # of containers, Default: 1
        securityGroup: vectorSecurityGroup,
        taskDefinition: vectorTask,
        listenerPort: 80,
        assignPublicIp: true,
        publicLoadBalancer: true
      }
    )
    
    // Control who has access to EFS
    fileSystem.connections.allowDefaultPortFrom(vectorService.service.connections);
  }
}

// class BackendStack extends Stack {
//   constructor(scope, id, props) {
//     super(scope, id, props);

//     const sharedResources = new SharedResources(this, 'shared-resources');

//     const vectorService = new VectorAwsStack(this, 'VectorService', {
//       CLUSTER: sharedResources.cluster,
//       VPC: sharedResources.vpc
//     });
//   }
// }

module.exports = { SharedResources, VectorAwsStack };
