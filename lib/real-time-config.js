const { CloudFrontClient, CreateRealtimeLogConfigCommand } = require("@aws-sdk/client-cloudfront");

const config  = { region: 'us-east-2' };

const input = { 
    EndPoints: [ 
      { 
        StreamType: 'Kinesis',
        KinesisStreamConfig: {
          RoleARN: roleARN, 
          StreamARN: streamARN,
        },
      },
    ],
    Fields: [
      'timestamp',
      'c-ip', 
      'time-to-first-byte', 
      'sc-status', 
      'sc-bytes', 
      'cs-method', 
      'cs-protocol', 
      'cs-host', 
      'cs-uri-stem', 
      'cs-bytes',
      'x-edge-location', 
      'x-edge-request-id', 
      'x-host-header', 
      'time-taken', 
      'cs-protocol-version',
      'c-ip-version', 
      'cs-user-agent', 
      'cs-referer', 
      'cs-cookie',
      'cs-uri-query',
      'x-edge-response-result-type', 
      'x-forwarded-for', 
      'ssl-protocol', 
      'ssl-cipher',
      'x-edge-result-type', 
      'fle-encrypted-fields', 
      'fle-status', 
      'sc-content-type',
      'sc-content-len', 
      'sc-range-start', 
      'sc-range-end', 
      'c-port', 
      'x-edge-detailed-result-type',
      'c-country', 
      'cs-accept-encoding', 
      'cs-accept',
      'cache-behavior-path-pattern', 
      'cs-headers', 
      'cs-header-names', 
      'cs-headers-count', 
      'origin-fbl', 
      'origin-lbl', 
      'asn'
    ],
    Name: 'real-time-log-configuration',
    SamplingRate: 100
  };
  
const cloudFrontClient = new CloudFrontClient(config);
const realtimeLogConfig = new CreateRealtimeLogConfigCommand(input);
const cloudFrontConfig = await cloudFrontClient.send(realtimeLogConfig);