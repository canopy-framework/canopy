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
/*
Here, you can either include options, which is probably how we will use this command from the Dashboard. If you don't include options, you are show a prompt where you can choose which alerts you want to set up. 
*/

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
  // at this point, `alerts` is in this format { Alert2: true, Alert4: true }
  // from here, we want to make the actual alert
  // Steps: get datasource, check for folder, make request
  
// get datasource UID
  const datasourceUID = await axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getDataSourceUIDPath}`)
    .then((result) => {
      return result.data.uid;
    })
    .catch((err) => console.log(err.response.data.message));

  // check for preconfigured folder, if it isn't there, make it

  const folders = await axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`)
    .then((result) => {
      return result.data;
    })
    .catch((err) => console.log(err.response.data.message));
  
  const preconfigFolderExists = folders.find(folderObj => folderObj.title === folderName);

  // if the folder doesn't exist, create it
  if (!preconfigFolderExists) {
    await axios.post(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`, {
      title: folderName,
    })
    console.log("created folder")
  } else { // it does exist, so we must have the uid stored somewhere, or just store it somewhere
    console.log("exists already");
  }

  console.log("preconfig folder exists", !!preconfigFolderExists);
  
  console.log(alerts);
}

module.exports = { provisionAlert };