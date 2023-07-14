const inquirer = require('inquirer');
const axios = require('axios');
const { alertTemplates } = require('../constants/alertTemplates');
const fs = require('fs');
const path = require('path');

const { createAlertPath, getDataSourceUIDPath, getFoldersPath, user, password, scheme, host, port, ruleGroup, folderName } = JSON.parse(fs.readFileSync(path.join(__dirname, '/../constants/grafana-config.json')));

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
  let index = 0;
  body.data[index]["datasourceUid"] = datasourceUID; // this still happens
  
  if (body.data[index]["model"]["datasource"] === undefined) {
    index = 1;
    body.data[index]["datasource"] = datasourceUID; // this needs to happen
  }

  body.data[index]["model"]["datasource"]["uid"] = datasourceUID; // this fails
  
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
      console.log(err.response.data.message);
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
            name: "Add an alert for latency",
            value: "Alert1"
          },
          {
            name: "Add an alert for the cache-hit ratio",
            value: "Alert2"
          },
          {
            name: "Add an alert for bandwidth",
            value: "Alert3"
          },
          {
            name: "Add an alert for the error rate",
            value: "Alert4"
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

  // list of alerts is in the alerts variable, its an object 
  //{ Alert1: true, Alert2: true }
  
  // for loop over object keys of alerts
    // find right template
    // generate body
    // send post request
  let alertNames = Object.keys(alerts);
  for (let i = 0; i < alertNames.length; i++) {
    const template = alertTemplates[alertNames[i]];
    const body = prepareAlertTemplate(datasourceUID, folderUID, template);
    await createAlert(body);
  }
}

module.exports = { provisionAlert };