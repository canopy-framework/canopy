const isValidAWSAccountNumber = (accountNumber) => {
  const awsAccountNumberRegex = /^\d{12}$/;

  return awsAccountNumberRegex.test(accountNumber) || "Invalid AWS account number!";
};

const isValidCloudFrontDistributionID = (distributionID) => {
  const cloudFrontIDRegex = /^[A-Z0-9]{14}$/;

  return cloudFrontIDRegex.test(distributionID) || "Invalid CloudFront Distribution ID!";
};

const isValidAWSAccessKeyID = (accessKeyID) => {
  const awsAccessKeyIDRegex = /^[A-Z0-9]{20}$/;

  return awsAccessKeyIDRegex.test(accessKeyID) || "Invalid AWS Access Key Id";
};

const isValidAWSSecretAccessKey = (secretAccessKey, choices) => {
  const awsSecretAccessKeyRegex = /^[A-Za-z0-9/+=]{40}$/;
  
  return awsSecretAccessKeyRegex.test(secretAccessKey) || "Invalid AWS Secret Access Key";
};

const isValidHttpEndpoint = (endpoint) => {
  const regex = /^https?:\/\/.+/;

  return regex.test(endpoint) || "Invalid HTTP endpoint";
};

module.exports = {
  isValidAWSAccountNumber,
  isValidCloudFrontDistributionID,
  isValidAWSAccessKeyID,
  isValidAWSSecretAccessKey,
  isValidHttpEndpoint
}