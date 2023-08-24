# Canopy

# Prerequisites

In order to run Canopy, you need to have the following prerequisites set up on your system:

- An AWS Account
- Install [AWS Command Line Interface (AWS CLI)](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Node.js v16
- SQLite3

# Usage

<!-- usage -->

```sh-session
$ npm install -g aws-cdk
$ npm install -g canopy-cli
$ canopy COMMAND
running command...
$ canopy --help [COMMAND]
Usage Canopy COMMAND
...
```

<!-- usagestop -->

## Getting Started

1. Install AWS CDK (Cloud Development Kit):

```console
$ npm install -g aws-cdk
```

2. Install Canopy's CLI:

```console
$ npm install -g canopy-cli
```

3. Run `canopy configure` to set up your AWS credentials, provide an initial CloudFront distribution, and bootstrap your AWS environment with AWS CDK resources.

4. Deploy Canopy's pipeline to AWS infrastructure and attach your CloudFront distribution to the pipeline:

```console
$ canopy deploy
```
5. After successful deployment, the Amazon EC2 public IP is output, and logs can now be processed by the pipeline. Visualize logs and metrics via the Grafana UI at http://{EC2_public_IP}:3000. 

The default login for Grafana is:
- username: admin
- password: admin

6. Launch Canopy's Admin Dashboard to monitor pipeline status and set up "quick" alerts:

```console
$ canopy launchDashboard
```

## Adding a CloudFront Distribution to the Pipeline
1. To add an additional distribution to the pipeline:

```console
$ canopy add
```

## Teardown
To delete all deployed AWS resources, run:

```console
$ canopy destroy
```

# Commands

<!-- commands -->

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
<!-- commandsstop -->
