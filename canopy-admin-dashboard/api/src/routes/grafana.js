import { Router } from 'express';
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const router = Router();

router.get('/config', async (_, res) => {
  const { port, host } = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../../../src/constants/grafana-config.json')));
  return res.send({
    host,
    port,
  });
});

router.get('/stats', async (req, res) => {
  const { port: GRAFANA_PORT, user: USERNAME,  password: PASSWORD, host: GRAFANA_HOST} = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../../../src/constants/grafana-config.json')));

  const GRAFANA_URL = `http://${USERNAME}:${PASSWORD}@${GRAFANA_HOST}:${GRAFANA_PORT}/api/admin`;

  if (!GRAFANA_PORT || !USERNAME || !PASSWORD) {
    console.error('Env Error: Incomplete Grafana Env Configuration');
  }

  const STATS_URL = GRAFANA_URL + '/stats';
  const USAGE_REPORT_URL = GRAFANA_URL + '/usage-report-preview';

  const statsPromise = axios.get(STATS_URL);
  const usagePromise = axios.get(USAGE_REPORT_URL);

  let results;
  try {
    results = await Promise.all([statsPromise, usagePromise]);
  } catch (error) {
    console.error('Error fetching grafana stats');
    return res.status(500).send(`Error fetching grafana stats: ${error}`);
  }

  const stats = results[0];
  const usage = results[1];

  const data = stats.data;
  const uData = usage.data;
  const info = {
    general: {},
    totals: {},
    users: {},
    activity: {}
  };
  try {
    info['general']['status'] = 'Ok.';
    info['general']['Grafana version'] = uData['version'];
    info['general']['uptime (seconds)'] = uData['metrics']['stats.uptime'];

    const date = new Date(
      parseInt(uData['metrics']['stats.database.created.time'], 10) * 1000
    );
    info['general']['creation date'] = date.toLocaleDateString();
    info['totals']['dashboards'] = data.dashboards;
    info['totals']['datasources'] = data.datasources;
    info['totals']['alerts'] = data.alerts;
    info['users']['users'] = data.users;
    info['users']['admins'] = data.admins;
    info['users']['editors'] = data.editors;
    info['users']['viewers'] = data.viewers;
    info['activity']['active users'] = data.activeUsers;
    info['activity']['active sessions'] = data.activeSessions;
    info['activity']['daily active users'] = data.dailyActiveUsers;
    info['activity']['monthly active users'] = data.monthlyActiveUsers;
  } catch (err) {
    return res.status(500).json({ error: 'error fetching grafana info' + err });
  }

  return res.status(200).send(info);
});

export default router;
