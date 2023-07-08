const { KinesisClient, DescribeStreamCommand } = require("@aws-sdk/client-kinesis");
const config = require("./config");

// Generate command for API call that gets Kinesis stream details 
export const kinesisClient = new KinesisClient(config);
const streamInput = { StreamName: "cloudfront-real-time-logs-data-stream" };
export const streamCommand = new DescribeStreamCommand(streamInput);