const inquirer = require('inquirer');
const axios = require('axios');
const { alertTemplates } = require('../constants/alertTemplates');
const fs = require('fs');
const path = require('path');
const ora = require('ora-classic');

const { createAlertPath, getDataSourceUIDPath, getFoldersPath, user, password, scheme, host, port, ruleGroup, folderName } = JSON.parse(fs.readFileSync(path.join(__dirname, '/../constants/grafana-config.json')));

const getDataSourceUID = () => {
  return axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getDataSourceUIDPath}`)
    .then((result) => {
      return result.data.uid;
    })
    .catch((err) => {
      console.log("There was an error fetching the datasource.")
      console.log(err.response.data.message)
    });
}

const getFolderUID = async () => {
  const folders = await axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`)
    .then((result) => {
      return result.data;
    })
    .catch((err) => {
      console.log(`There was an error fetching the ${folderName} folder uid.`)
      console.log(err.response.data.message)
    });

  let preconfigFolder = folders.find(folderObj => folderObj.title === folderName);

  if (preconfigFolder) {
    return preconfigFolder.uid;
  } else {
    preconfigFolder = await axios
      .post(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`, {
        title: folderName,
      })
      .then((result) => result.data)
      .catch((err) => {
        console.log(`There was an error creating the ${folderName} folder`)
        console.log(err.response.data.message);
      });

    return preconfigFolder.uid;
  }
}

const prepareAlertTemplate = (datasourceUID, folderUID, alertTemplate) => {
  let body = alertTemplate;
/*
// time taken template
// body.data[0]["datasourceUid"]
// body.data[0]["model"]["datasource"]["uid"]

// Bandwidth Template
// body.data[0]["datasourceUid"]
// body.data[0]["model"]["datasource"]["uid"]

// Error Rate
// body.data[0]["datasourceUid"]
// body.data[1]["datasourceUid"]
// body.data[1]["model"]["datasource"]["uid"]

// Cache hit < 50% template
// body.data[0]["datasourceUid"]
// body.data[0]["model"]["datasource"]["uid"]
// body.data[1]["datasourceUid"]
// body.data[1]["model"]["datasource"]["uid"]
*/

  body.data[0]["datasourceUid"] = datasourceUID;

  if (body.title === "Time Taken > 500ms" || body.title === "Total Bandwidth > 6mb") {
    body.data[0]["model"]["datasource"]["uid"] = datasourceUID;
  } else if (body.title === "Cache Hit < 50%") {
    body.data[0]["model"]["datasource"]["uid"] = datasourceUID;
    body.data[1]["datasourceUid"] = datasourceUID;
    body.data[1]["model"]["datasource"]["uid"] = datasourceUID;
  } else {
    body.data[1]["datasourceUid"] = datasourceUID;
    body.data[1]["model"]["datasource"]["uid"] = datasourceUID;
  }
  
  body.folderUID = folderUID;
  body.ruleGroup = ruleGroup;
  
  return body;
}

const createAlert = (body) => {
  const spinner = ora({ text: `Creating the alert ${body.title}` }).start();
  return axios
    .post(`${scheme}${user}:${password}@${host}:${port}${createAlertPath}`, {...body}, {
      headers: {
      'Content-Type': 'application/json',
      'X-Disable-Provenance': '',
      }
  })
    .then((result)=> {
      spinner.succeed();
    })
    .catch((err) => {
      console.log("There was an error creating the alert.");
      console.log(err.response.data.message);
      spinner.fail();
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

    alertsSelected.alerts.forEach(alertName => alerts[alertName] = true);
  }
  
  const datasourceUID = await getDataSourceUID();
  const folderUID = await getFolderUID();

  let alertNames = Object.keys(alerts);
  
  for (let i = 0; i < alertNames.length; i++) {
    const template = alertTemplates[alertNames[i]];
    const body = prepareAlertTemplate(datasourceUID, folderUID, template);
    await createAlert(body);
  }
}

module.exports = { provisionAlert };