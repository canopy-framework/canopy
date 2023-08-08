const { Stack, Duration, Fn, PhysicalName, RemovalPolicy, } = require('aws-cdk-lib');
const { KinesisEventSource, SqsEventSource } = require('aws-cdk-lib/aws-lambda-event-sources');
const kinesis = require('aws-cdk-lib/aws-kinesis');
const lambda  = require('aws-cdk-lib/aws-lambda');
const iam     = require('aws-cdk-lib/aws-iam');
const sqs     = require('aws-cdk-lib/aws-sqs');
const s3      = require('aws-cdk-lib/aws-s3');
const path    = require('path');
const destinations = require('aws-cdk-lib/aws-lambda-destinations');
const AWSConfig    = require('../aws-config.json');

class RealTimeLogsPipeline extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.templateOptions.description = "Create a real-time logging pipeline from CloudFront to Canopy's storage";

    // Create a new Kinesis Data stream to steam real-time logs
    const stream = new kinesis.Stream(this, 'InputStream', {
      streamName: 'cloudfront-real-time-logs-data-stream',
      streamMode: kinesis.StreamMode.ON_DEMAND
    });

    // Create an SQS queue to handle logs that couldn't be processed by lambda (realtime_logs_parser) 
    const deadLetterQueue = new sqs.Queue(this, 'FailedLogsQueue', {
      queueName: 'failed-logs-queue',
    });

    // Create an S3 bucket whose contents can be destroyed along with the bucket and rest of the stack
    const bucket = new s3.Bucket(this, 'Failed Logs Bucket', {
      bucketName: "failed-log-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Import the EC2 instance public IP from Canopy's backend stack deployment
    const EC2_PUBLIC_IP = Fn.importValue('CanopyBackendIP');

    // Canopy storage environment variables
    const CANOPY_DB_NAME = "canopy";
    const CANOPY_REAL_TIME_LOGS_TABLE = "realtime_logs";

    // Create an IAM role for the Lambda function
    const realTimeLogsLambdaRole = new iam.Role(this, 'Real-time logs LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'real-time-logs-lambda-role',
      physicalName: PhysicalName.GENERATE_IF_NEEDED,
    });

    // Attach the `AWSLambdaKinesisExecutionRole` managed policy to the role assigned to the lambda fucntion
    realTimeLogsLambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaKinesisExecutionRole'));

    // Create lambda function for processing real-time logs
    const realTimeLogsParser = new lambda.Function(this, 'Real-time logs parser', {
      functionName: "realtime-logs-parser",
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './lambdas/realtime_logs_parser')),
      environment: {
        EC2_PUBLIC_IP: EC2_PUBLIC_IP,
        KINESIS_STREAM_NAME: stream.streamName,
        CANOPY_DB: CANOPY_DB_NAME,
        CANOPY_LOGS_TABLE: CANOPY_REAL_TIME_LOGS_TABLE,
      },
      role: realTimeLogsLambdaRole,
    });

    // Create an Event source(stream) mapping
    // that will cause Lambda engine to trigger the lambda function based on the below config
    const KinesisEventSourceConfig = new KinesisEventSource(stream, {
      batchSize: 10000,                                              // The largest number of records that AWS Lambda will retrieve from your event source at the time of invoking your function.
      startingPosition: lambda.StartingPosition.LATEST,              // Where to begin consuming the stream.
      maxBatchingWindow: Duration.seconds(Number(AWSConfig.realtimeBuffer)), // The maximum amount of time to gather records before invoking the function.
      maxRecordAge: Duration.seconds(60),                            // The maximum age of a record that Lambda sends to a function for processing.
      reportBatchItemFailures: true,                                 // Allow functions to return partially successful responses for a batch of records.
      retryAttempts: 3,                                              // Maximum number of retry attempts Valid Range: * Minimum value of 0 * Maximum value of 10000.
      bisectBatchOnError: true,                                      // if the function returns an error, split the batch in two and retry.
      onFailure: new destinations.SqsDestination(deadLetterQueue),
    })

    realTimeLogsParser.addEventSource(KinesisEventSourceConfig);

    // Grant Lambda function permission to read from Kinesis data stream
    stream.grantRead(realTimeLogsParser);

    // Create an IAM role for the failed logs lambda function
    const failedLogsLambdaRole = new iam.Role(this, 'failed logs LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'failed-logs-lambda-role',
      physicalName: PhysicalName.GENERATE_IF_NEEDED,
    });

    // Create policy to grant read and delete access to the lambda function on SQS policy
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:SendMessage'],
      resources: [deadLetterQueue.queueArn],
    });

    failedLogsLambdaRole.addToPolicy(policyStatement);
    failedLogsLambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"))

    // Create Lambda function to handle failed logs
    const failedLogsParser = new lambda.Function(this, 'Failed logs parser', {
      functionName: 'failed-logs-parser',
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './lambdas/failed_logs_parser')),
      role: failedLogsLambdaRole,
    });

    // Create an Event source(SQS) mapping
    // that will cause Lambda engine to trigger the lambda function based on the below config
    const SqsEventSourceConfig = new SqsEventSource(deadLetterQueue, {
      batchSize: 10000,                          // The largest number of records that AWS Lambda will retrieve from your event source at the time of invoking your function.
      enabled: true,                             // If the SQS event source mapping should be enabled.    
      maxBatchingWindow: Duration.seconds(300),  // The maximum amount of time to gather records before invoking the function.
      reportBatchItemFailures: true,             // Allow functions to return partially successful responses for a batch of records.
    });

    failedLogsParser.addEventSource(SqsEventSourceConfig);

    // Grant Lambda function permissions to put objects in the S3 bucket
    bucket.grantPut(failedLogsParser);
  }
}

module.exports = { RealTimeLogsPipeline }
