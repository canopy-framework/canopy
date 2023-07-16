const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ora = require('ora-classic');
const { 
  createAlertPath, 
  getDataSourceUIDPath, 
  getFoldersPath, 
  user, 
  password, 
  scheme, 
  host, 
  port, 
  folderName 
} = JSON.parse(fs.readFileSync(path.join(__dirname, '/../constants/grafana-config.json')));

const getDataSourceUID = () => {
  return axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getDataSourceUIDPath}`)
    .then((result) => {
      return result.data.uid;
    })
    .catch((err) => {
      console.log("There was an error fetching the datasource.")
    });
}

const getListOfFolders = () => {
  return axios
    .get(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`)
    .then((result) => {
      return result.data;
    })
    .catch((err) => {
      console.log(`There was an error fetching the list of folders.`)
    });
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
      spinner.fail();
      console.log("There was an error creating the alert.")
    })
}

const createFolder = () => {
  return axios
    .post(`${scheme}${user}:${password}@${host}:${port}${getFoldersPath}`, {
      title: folderName,
    })
    .then((result) => result.data)
    .catch(() => {
      console.log(`There was an error creating the ${folderName} folder`)
    });
}

module.exports = {
  getDataSourceUID,
  createAlert,
  getListOfFolders,
  createFolder
}