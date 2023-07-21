const AWS = require('aws-sdk');
const AWSConfig = require('../../../aws-config.json');

const s3 = new AWS.S3({ region: 'us-east-1' });

exports.handler = async function(event) {
  try {
    const { Records } = event;

    // Create an array of promises to store the processed logs
    const promises = Records.map(async (record) => {
      // Store the processed logs as JSON in Canopy's S3 "failed-logs-bucket"
      await s3.putObject({
        Bucket: "failed-logs-bucket",
        Key: `processed-log-${new Date().toISOString()}.json`,
        Body: record.body,
      }).promise();

    });

    // Wait for all the promises to complete
    await Promise.all(promises);

    console.log('Successfuly stored all failed Logs in S3 bucket: "failed-logs-bucket"');
  } catch (error) {
    console.error('Error Storing failed logs:', error);
  }
};