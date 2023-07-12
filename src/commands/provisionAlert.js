const inquirer = require('inquirer');
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

  console.log(alerts);
}

module.exports = { provisionAlert };