const http = require("http");
const { logFields, fieldTypes } = require("./realtime_log_data"); 

const numberOrNull = (fieldVal, flag) => {
  if (fieldVal.includes("-")) return null;

  return flag ? parseInt(fieldVal, 10) : parseFloat(fieldVal);
};

function insertLogsIntoDB(logsBatch) {
  // Prepare the values for batch insertion
  const values = logsBatch
    .map(log => Object.values(log).map(value => `'${value}'`).join(','))
    .join('),(');
  
  // ClickHouse Database and table name
  const { CANOPY_DB: database, CANOPY_LOGS_TABLE: table } = process.env;

  // The batch INSERT query
  const insertQuery = `INSERT INTO ${database}.${table} (${logFields.concat("log").join(",")}) VALUES (${values})`;
  
  const options = {
    hostname: process.env.EC2_PUBLIC_IP,
    port: 8123,
    path: "/",
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(insertQuery),
    },
  };

  const req = http.request(options, (res) => {
    let responsePayload = '';

    res.on('data', (chunk) => {
      responsePayload += chunk;
    });
  
    res.on('end', () => {
      const { statusCode } = res;

      switch (true) {
        case (statusCode >= 500):
          console.log('Something is wrong with the Database server! check DB server logs');
          break;
        case (statusCode >= 400):
          console.log('Something is wrong with your query! Double check your query');
          break;
        case (statusCode === 200):
          console.log(`Logs batch insertion was successful`);
          break;
        default:
          console.log(`Whoops! Something Went wrong. Response status code: ${statusCode}`);
      }

      console.log("response body:", responsePayload);
    });
  });

  req.on('error', (error) => {
    console.error('Error inserting logs:', error.message);

    // This is intentional in order for the event source mapping to reprocess 
    // the entire batch until the function succeeds.
    // Docs: https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html
    throw error 
  });

  req.write(insertQuery);
  req.end();
}

exports.handler = function(event) {
  const { Records } = event; 
  const parsedRealtimeLogs = [];

  Records.forEach(record => {
    const realtimeLog = Buffer.from(record.kinesis.data, 'base64').toString('ascii');
    console.log('Decoded payload:', realtimeLog);
    
    const logValues =  realtimeLog.split(/\t/).map(value => value.trim());
    const parsedLog = {};

    logFields.forEach((logField, index) => {
      const fieldType = fieldTypes[logField];
      const logValue  = logValues[index];

      switch(fieldType) {
        case "str":
          parsedLog[logField] = logValue;
          break;
        case "timestr":
          parsedLog[logField] = parseInt(logValue);
          break;
        case "int":
          parsedLog[logField] = numberOrNull(logValue, true);
          break;
        case "float":
          parsedLog[logField] = numberOrNull(logValue);
          break;
      }
    });

    // add an extra field `log` that stores a JSON version of the log
    parsedLog.log = JSON.stringify(Object.assign({}, parsedLog));

    parsedRealtimeLogs.push(parsedLog);
  });

  insertLogsIntoDB(parsedRealtimeLogs);
};