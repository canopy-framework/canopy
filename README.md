# Welcome to Canopy

In order to run Canopy, you need to have the following prerequisites set up on your system:

- `aws` command, you can find more information on how to set it up [here](https://aws.amazon.com/cli/)
- AWS Account
- Node.js 16
- SQLite3

# Installation

1. run `npm install -g canopy-cli`
2. run `npm install -g aws-cdk`

# Usage

```
$ canopy
Usage: Canopy [options] [command]

Canopy Infrastructure Management API

Options:
  -h, --help           display help for command

Commands:
  add [options]        Attach Real-Time Log Configuration to Distribution
  deploy               Deploy Canopy Infrastructure to AWS
  destroy              Destroy Canopy Infrastructure on AWS
  configure [options]  Configure your AWS credentials
  alert [options]      Add pre-configured alerts to your Grafana instance
  launchDashboard      Launches Canopy Admin Dashboard
  help [command]       display help for command
```

### Login for Grafana

username: admin
password: admin
