const isValidAWSAccountNumber = (accountNumber) => {
  const awsAccountNumberRegex = /^\d{12}$/;

  return awsAccountNumberRegex.test(accountNumber) || "Invalid AWS account number!";
};

const isValidCloudFrontDistributionID = (distributionID) => {
  const cloudFrontIDRegex = /^[A-Z0-9]{13,}$/;

  return cloudFrontIDRegex.test(distributionID) || "Invalid CloudFront Distribution ID!";
};

const isValidAWSAccessKeyID = (accessKeyID) => {
  const awsAccessKeyIDRegex = /^[A-Z0-9]{20}$/;

  return awsAccessKeyIDRegex.test(accessKeyID) || "Invalid AWS Access Key Id!";
};

const isValidAWSSecretAccessKey = (secretAccessKey) => {
  const awsSecretAccessKeyRegex = /^[A-Za-z0-9/+=]{40}$/;
  
  return awsSecretAccessKeyRegex.test(secretAccessKey) || "Invalid AWS Secret Access Key!";
};

const isValidHttpEndpoint = (endpoint) => {
  const httpEndpointRegex = /^https?:\/\/.+/;

  return httpEndpointRegex.test(endpoint) || "Invalid HTTP endpoint!";
};

const isValidRealtimeBuffer = (buffer) => {
  const bufferRegex = /^(?:[1-9]|[1-5]\d|60)$/;

  return bufferRegex.test(buffer) || "Invalid buffer interval value!";
}

module.exports = {
  isValidAWSAccountNumber,
  isValidCloudFrontDistributionID,
  isValidAWSAccessKeyID,
  isValidAWSSecretAccessKey,
  isValidHttpEndpoint,
  isValidRealtimeBuffer
}