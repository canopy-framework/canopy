const fs = require('fs');
const inquirer = require('inquirer');

const configure = async () => {
  // need to add validation
  
  const answers = await inquirer.prompt([
    {
        name: "accessKey",
        message: "Please enter your access key:",
    },
    {
      name: "secretAccessKey",
      message: "Please enter your secret access key:",
    },
    {
      name: "cloudfrontARN",
      message: "Please enter the ARN of a currently running CloudFront Distribution:",
    },
]);

console.log(answers.accessKey, answers.secretAccessKey, answers.cloudfrontARN);

fs.writeFileSync('./fake-aws-creds.json', JSON.stringify({accessKey: answers.accessKey, secretAccessKey: answers.secretAccessKey, cloudfrontARN: answers.cloudfrontARN}, null, 2))
}

module.exports = { configure };