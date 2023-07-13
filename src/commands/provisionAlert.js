const inquirer = require('inquirer');
const axios = require('axios');
const user = "admin";
const password = "admin";
// admin:admin@Localhost:3000
const scheme = "http://"
const host = "localhost";
const port = 3000;
const createAlertPath = "/api/v1/provisioning/alert-rules";
const getDataSourceUIDPath = "/api/datasources/name/ClickHouse";
const getFoldersPath = "/api/folders";
const ruleGroup = "pre-configured"; 
const folderName = "Pre-Configured Alerts";
let alert1Template = {
  "annotations":{"__dashboardUid__":"d26bb8ae-aea9-4b85-bc17-5b81054a0217","__panelId__":"3"},
  "condition":"C",
  "data":[{"refId":"A","queryType":"sql","relativeTimeRange":{"from":3667837,"to":39038},"datasourceUid":"","model":{"builderOptions":{"0":"T","1":"h","10":"i","11":"s","12":" ","13":"n","14":"o","15":"t","16":" ","17":"a","18":" ","19":"s","2":"e","20":"e","21":"l","22":"e","23":"c","24":"t","25":" ","26":"s","27":"t","28":"a","29":"t","3":" ","30":"e","31":"m","32":"e","33":"n","34":"t","35":".","4":"q","5":"u","6":"e","7":"r","8":"y","9":" ","fields":[],"filters":[{"condition":"AND","filterType":"custom","key":"timestamp","operator":"WITH IN DASHBOARD TIME RANGE","restrictToFields":[{"label":"timestamp","name":"timestamp","picklistValues":[],"type":"DateTime"}],"type":"datetime"}],"limit":100,"metrics":[],"mode":"trend","orderBy":[],"table":"realtime_logs","timeField":"timestamp","timeFieldType":"DateTime"},"datasource":{"type":"grafana-clickhouse-datasource","uid":""},"intervalMs":1000,"maxDataPoints":43200,"meta":{"builderOptions":{"0":"T","1":"h","10":"i","11":"s","12":" ","13":"n","14":"o","15":"t","16":" ","17":"a","18":" ","19":"s","2":"e","20":"e","21":"l","22":"e","23":"c","24":"t","25":" ","26":"s","27":"t","28":"a","29":"t","3":" ","30":"e","31":"m","32":"e","33":"n","34":"t","35":".","4":"q","5":"u","6":"e","7":"r","8":"y","9":" ","fields":[],"filters":[{"condition":"AND","filterType":"custom","key":"timestamp","operator":"WITH IN DASHBOARD TIME RANGE","restrictToFields":[{"label":"timestamp","name":"timestamp","picklistValues":[],"type":"DateTime"}],"type":"datetime"}],"limit":100,"metrics":[],"mode":"trend","orderBy":[],"table":"realtime_logs","timeField":"timestamp","timeFieldType":"DateTime"}},"queryType":"sql","rawSql":"SELECT toStartOfInterval(timestamp, INTERVAL (($__toTime - $__fromTime) / 20) SECOND ) AS d,\nquantile(0.95)(time_taken) AS `95 Percentile`\nFROM \"realtime_logs\"\nWHERE timestamp  \u003e= $__fromTime AND timestamp \u003c= $__toTime\nGROUP BY d ORDER BY d ASC","refId":"A"}},{"refId":"B","relativeTimeRange":{"from":3667837,"to":39038},"datasourceUid":"__expr__","model":{"conditions":[{"evaluator":{"params":[],"type":"gt"},"operator":{"type":"and"},"query":{"params":["B"]},"reducer":{"params":[],"type":"last"},"type":"query"}],"datasource":{"type":"__expr__","uid":"__expr__"},"expression":"A","hide":false,"intervalMs":1000,"maxDataPoints":43200,"reducer":"last","refId":"B","type":"reduce"}},{"refId":"C","relativeTimeRange":{"from":3667837,"to":39038},"datasourceUid":"__expr__","model":{"conditions":[{"evaluator":{"params":[0.05],"type":"gt"},"operator":{"type":"and"},"query":{"params":["C"]},"reducer":{"params":[],"type":"last"},"type":"query"}],"datasource":{"type":"__expr__","uid":"__expr__"},"expression":"B","hide":false,"intervalMs":1000,"maxDataPoints":43200,"refId":"C","type":"threshold"}}],
  "execErrState":"Error",
  "folderUID":"",
  "for":"5m",
  "noDataState":"NoData",
  "orgID":1,
  "ruleGroup":"",
  "title":"Time Taken > 600ms",
}

/*
Here, you can either include options, which is probably how we will use this command from the Dashboard. If you don't include options, you are show a prompt where you can choose which alerts you want to set up. 
*/

const getDataSourceUID = () => {
  return axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getDataSourceUIDPath}`)
    .then((result) => {
      return result.data.uid;
    })
    .catch((err) => {
      // make sure the CLI app stops here 
      console.log("There was an error fetching the datasource.")
      console.log(err.response.data.message)
    });
}

const getFolderUID = async () => {
  // get all folders
  const folders = await axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`)
    .then((result) => {
      return result.data;
    })
    .catch((err) => {
      console.log(`There was an error fetching the ${folderName} folder uid.`)
      console.log(err.response.data.message)
    });

  // check to see if we made the folder already
  let preconfigFolder = folders.find(folderObj => folderObj.title === folderName);

  // if the folder exists, return the uid
  if (preconfigFolder) {
    return preconfigFolder.uid;
  } else { // the folder does not exist, create it and return the uid
    preconfigFolder = await axios
      .post(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`, {
        title: folderName,
      })
      .then((result) => result.data)
      .catch((err) => {
        console.log(`There was an error creating the ${folderName} folder`)
        console.log(err.response.data.message);
      });
    console.log("this is what gets returned when you create a folder", preconfigFolder);
    return preconfigFolder.uid;
  }
}

const provisionAlert = async (options) => {
  let alerts = options;
  if (Object.keys(alerts).length === 0) {
    const alertsSelected = await inquirer.prompt([
      {   
        type: "checkbox",
        name: "alerts",
        message: "Add any of the below alerts",
        choices: [
          {
            name: "Add an alert that will fire when latency remains elevated for 5 minutes",
            value: "Alert1"
          },
          {
            name: "Option 2",
            value: "Alert2"
          },
          {
            name: "Option 3",
            value: "Alert3"
          },
          {
            name: "Option 4",
            value: "Alert4"
          },
          {
            name: "Option 5",
            value: "Alert5"
          }, 
        ]
      },
    ]);
    // standardize `alerts` so that it looks the same as if the options were used, an object with 
    alertsSelected.alerts.forEach(alertName => alerts[alertName] = true);
  }
  
  // get datasource UID
  const datasourceUID = await getDataSourceUID();

  // check for preconfigured folder, if it isn't there, make it
  const folderUID = await getFolderUID();

  // make request to create the alert
  // what do we need here? get the object, set the datasource in both spots, folder, rule group

  let body = alert1Template;
  body.data[0]["datasourceUid"] = datasourceUID;
  body.data[0]["model"]["datasource"]["uid"] = datasourceUID;
  body.folderUID = folderUID;
  body.ruleGroup = ruleGroup;

  // remember the provenance header
  await axios
    .post(`${scheme}${user}:${password}@${host}:${port}${createAlertPath}`, {...body}, {
      headers: {
      'Content-Type': 'application/json',
      'X-Disable-Provenance': '',
      }
  })
    .then((result)=> console.log(result))
    .catch((err) => console.log(err))

}

module.exports = { provisionAlert };