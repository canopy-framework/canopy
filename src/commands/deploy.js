const gradient = require('gradient-string');
const { canopyLogo } = require('../constants/canopy-logo');
const ora = require('ora-classic');

const deploy = async () => {
  console.log("Deploying AWS infrastructure necessary to run Canopy");
  console.log(gradient.atlas(canopyLogo));
  const spinner = ora({ text: "Provisioning your AWS Infrastructure" }).start();
  
  // represents the actual provisioning
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(console.log()), 2000)
  });

  // spinner.stopAndPersist({symbol: "✔️", text: "Infrastructure Deployed"})
  spinner.succeed();
}

module.exports = { deploy };