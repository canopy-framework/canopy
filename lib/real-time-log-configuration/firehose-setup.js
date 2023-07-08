const { FirehoseClient, DescribeDeliveryStreamCommand } = require("@aws-sdk/client-firehose");
const config = require("./config");

// Generate command for API call that gets Firehose stream details
export const firehoseClient = new FirehoseClient(config);
const firehoseInput = { DeliveryStreamName: 'cloudfront-real-time-logs-delivery-stream' };
export const firehoseCommand = new DescribeDeliveryStreamCommand(firehoseInput);