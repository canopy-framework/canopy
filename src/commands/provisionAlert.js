const inquirer = require('inquirer');
const { alertTemplates } = require('../constants/alertTemplates');
const fs = require('fs');
const path = require('path');
const { getDataSourceUID, createAlert, getListOfFolders, createFolder } = require('../services/grafana');

const { ruleGroup, folderName } = JSON.parse(fs.readFileSync(path.join(__dirname, '/../constants/grafana-config.json')));

const getFolderUID = async () => {
  const folders = await getListOfFolders();
  let preconfigFolder = folders.find(folderObj => folderObj.title === folderName);

  if (preconfigFolder) {
    return preconfigFolder.uid;
  } else {
    preconfigFolder = await createFolder();
    return preconfigFolder.uid;
  }
}

const prepareAlertTemplate = (datasourceUID, folderUID, alertTemplate) => {
  let body = alertTemplate;

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

const provisionAlert = async (options) => {
  let alerts = options;
  const choices = JSON.parse(fs.readFileSync(path.join(__dirname, '/../constants/alert-choices.json')));
  if (Object.keys(alerts).length === 0) {
    const alertsSelected = await inquirer.prompt([
      {   
        type: "checkbox",
        name: "alerts",
        message: "Add any of the below alerts",
        choices,
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