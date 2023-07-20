const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const path = require('path');
const pathToDashboard = path.join(__dirname, '../../canopy-admin-dashboard/api')

const launchDashboard = () => {
  exec(`cd ${pathToDashboard} && npm start`);
  console.log("In your browser, go to http://localhost:3001 to visit Canopy's Admin Dashboard ");
}

module.exports = { launchDashboard };