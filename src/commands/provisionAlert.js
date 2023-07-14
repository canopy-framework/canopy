const inquirer = require('inquirer');
const axios = require('axios');
const user = "admin";
const password = "admin";
const scheme = "http://"
const host = "localhost";
const port = 3000;
const createAlertPath = "/api/v1/provisioning/alert-rules";
const getDataSourceUIDPath = "/api/datasources/name/ClickHouse";
const getFoldersPath = "/api/folders";
const ruleGroup = "pre-configured"; 
const folderName = "Pre-Configured Alerts";
const { alertTemplates } = require('../constants/alertTemplates');

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

const prepareAlertTemplate = (datasourceUID, folderUID, alertTemplate) => {
  let body = alertTemplate;
  body.data[0]["datasourceUid"] = datasourceUID;
  body.data[0]["model"]["datasource"]["uid"] = datasourceUID;
  body.folderUID = folderUID;
  body.ruleGroup = ruleGroup;
  return body;
}

const createAlert = (body) => {
  return axios
    .post(`${scheme}${user}:${password}@${host}:${port}${createAlertPath}`, {...body}, {
      headers: {
      'Content-Type': 'application/json',
      'X-Disable-Provenance': '',
      }
  })
    .then((result)=> console.log(result.data))
    .catch((err) => {
      console.log("There was an error creating the alert.");
      console.log(err);
    })
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
    // standardize `alerts` so that it looks the same as if the options were used
    alertsSelected.alerts.forEach(alertName => alerts[alertName] = true);
  }
  
  // get datasource UID
  const datasourceUID = await getDataSourceUID();

  // check for preconfigured folder, if it isn't there, make it, get UID
  const folderUID = await getFolderUID();

  // prepare the body to be sent with the post request
  const body = prepareAlertTemplate(datasourceUID, folderUID, alert1Template);

  // send the post request
  await createAlert(body);
  

}

module.exports = { provisionAlert };