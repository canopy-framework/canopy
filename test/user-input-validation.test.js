
const {
  isValidAWSAccountNumber,
  isValidCloudFrontDistributionID,
  isValidAWSAccessKeyID,
  isValidAWSSecretAccessKey,
  isValidHttpEndpoint,
} = require('../src/utils/user-input-validation');

describe('isValidAWSAccountNumber', () => {
  test('should return true for a valid AWS account number', () => {
    const accountNumber = '123456789012';
    expect(isValidAWSAccountNumber(accountNumber)).toBe(true);
  });

  test('should return "Invalid AWS account number!" for an invalid AWS account number', () => {
    const accountNumber = '12345678901'; 
    expect(isValidAWSAccountNumber(accountNumber)).toBe('Invalid AWS account number!');
  });
});

describe('isValidCloudFrontDistributionID', () => {
  test('should return true for a valid CloudFront Distribution ID', () => {
    const distributionID = 'ABC123DE456FG7';
    expect(isValidCloudFrontDistributionID(distributionID)).toBe(true);
  });

  test('should return "Invalid CloudFront Distribution ID!" for an invalid CloudFront Distribution ID', () => {
    const distributionID = 'ABC1234'; 
    expect(isValidCloudFrontDistributionID(distributionID)).toBe('Invalid CloudFront Distribution ID!');
  });
});

describe('isValidAWSAccessKeyID', () => {
  test('should return true for a valid AWS Access Key ID', () => {
    const accessKeyID = 'ABCDEFGHIJKLMNOPQRST';
    expect(isValidAWSAccessKeyID(accessKeyID)).toBe(true);
  });

  test('should return "Invalid AWS Access Key Id" for an invalid AWS Access Key ID', () => {
    const accessKeyID = 'ABCDEFGH';
    expect(isValidAWSAccessKeyID(accessKeyID)).toBe('Invalid AWS Access Key Id!');
  });
});

describe('isValidAWSSecretAccessKey', () => {
  test('should return true for a valid AWS Secret Access Key', () => {
    const secretAccessKey = 'ABCD/EFGHIJKLMNOPQRSTUVWXYZ12345/67890cd';
    expect(isValidAWSSecretAccessKey(secretAccessKey)).toBe(true);
  });

  test('should return "Invalid AWS Secret Access Key" for an invalid AWS Secret Access Key', () => {
    const secretAccessKey = 'ABCDEF';
    expect(isValidAWSSecretAccessKey(secretAccessKey)).toBe('Invalid AWS Secret Access Key!');
  });
});

describe('isValidHttpEndpoint', () => {
  test('should return true for a valid HTTPS endpoint', () => {
    const endpoint = 'https://example.com';
    expect(isValidHttpEndpoint(endpoint)).toBe(true);
  });

  test('should return true for a valid HTTP endpoint', () => {
    const endpoint = 'http://example.fr';
    expect(isValidHttpEndpoint(endpoint)).toBe(true);
  });

  test('should return "Invalid HTTP endpoint" for an invalid HTTP endpoint', () => {
    const endpoint = 'example.com';
    expect(isValidHttpEndpoint(endpoint)).toBe('Invalid HTTP endpoint!');
  });
});
