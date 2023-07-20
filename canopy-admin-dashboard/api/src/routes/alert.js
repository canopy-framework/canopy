import { Router } from 'express';
import { exec } from 'child_process';
import axios from 'axios';
import { alertTemplates } from '../../../../src/constants/alertTemplates';
import fs from 'fs';
import path from 'path';
const { port: GRAFANA_PORT, user: GRAFANA_USERNAME,  password: GRAFANA_PASSWORD, host: GRAFANA_HOST} = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../../../src/constants/grafana-config.json')));

const router = Router();

const alertChoices = () => {
  // dummy data
  const alertsData = {};
  const alertDescriptions = readAlertDescriptions();
  Object.keys(alertTemplates).forEach((key) => {
    alertsData[key] = {
      name: null,
      title: alertTemplates[key]['title'],
      selected: false
    };
  });
  alertDescriptions.forEach((description) => {
    alertsData[description['value']]['name'] = description['name'];
  });
  return alertsData;
};

// reads the alert descriptions from a JSON file
const readAlertDescriptions = () => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '/../../../../src/constants/alert-choices.json')));
};

const checkIfAlertsAlreadyActive = async (choices) => {
  const queryPath = `/api/v1/provisioning/alert-rules`;
  const query = `http://${GRAFANA_USERNAME}:${GRAFANA_PASSWORD}@${GRAFANA_HOST}:${GRAFANA_PORT}${queryPath}`;
  let result;
  try {
    result = await axios.get(query);
  } catch (error) {
    console.log('There was an error fetching the active alert rules from grafana');
    return choices;
  }
  const existingAlertsData = result.data;
  if (Array.isArray(existingAlertsData)) {
    const existingTitles = existingAlertsData.map((datum) => {
      return datum.title;
    });
    const keys = Object.keys(choices);
    keys.forEach((key) => {
      if (existingTitles.includes(choices[key]['title'])) {
        choices[key]['active'] = true;
      }
    });
  }
  return choices;
};

// returns an array of all quick alerts
router.get('/all', async (_, res) => {
  const choices = alertChoices();
  await checkIfAlertsAlreadyActive(choices);
  return res.status(200).json(choices);
});

router.post('/', (req, res) => {
  const alertsToConfigure = req.body.data;
  const alertsAsCLIOptions = alertsToConfigure
    .map((alertName) => {
      const match = alertName.match(/\d+$/g)[0];
      return '-' + match;
    })
    .join(' ');

  exec(`canopy alert ${alertsAsCLIOptions}`, (error, stdout, stderr) => {
    if (error) {
      console.log('error: ', error);
    }
    if (stderr) {
      console.log('stderr: ', stderr);
    }
    // res.send(stderr);
    console.log('stdout: ', stdout);
  });
  console.log('configuring alert');
  // Mock response data
  // canopy alert [alertsToConfigure]
  const alertsConfigured = alertsToConfigure;
  res.status(200).json(alertsConfigured);
});

export default router;
