const AWS = require('aws-sdk');

const s3  = new AWS.S3();
const sqs = new AWS.SQS(); 

exports.handler = async function(event) {
  try {
    const { Records } = event;
    const queueUrl = await getQueueUrl('failed-logs-queue');

    const promises = Records.map(async (record) => {
      await s3.putObject({
        Bucket: "failed-logs-bucket",
        Key: `processed-log-${new Date().toISOString()}.json`,
        Body: record.body,
      }).promise();

      // delete message from SQS queue after it has been successfuly stored in S3 bucket
      return deleteMessage(queueUrl, record.receiptHandle);
    });

    // Wait for all the promises to complete
    await Promise.all(promises);

    console.log('Successfuly stored all failed Logs in S3 bucket: "failed-logs-bucket"');
  } catch (error) {
    console.error('Error Storing failed logs:', error);
  }
};

async function getQueueUrl(queueName) {
  const response = await sqs.getQueueUrl({ QueueName: queueName }).promise();
  return response.QueueUrl;
}

async function deleteMessage(queueUrl, receiptHandle) {
  const params = {
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle,
  };

  await sqs.deleteMessage(params).promise();
}