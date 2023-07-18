import { Router } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
const filePath = '../aws-config.json';
const router = Router();

router.post('/setAWSInfo', (req, res) => {
  const data = req.body.data;
  console.log(data);
  // {
  //   accountNumber: '123',
  //   distributionId: '123',
  //   httpEndpoint: 'https://123',
  //   secretKey: '123',
  //   region: '123',
  //   deployed: false
  // }
  // const jsonData = JSON.stringify(data, null, 2);
  // try {
  //   fs.writeFileSync(filePath, jsonData);
  // } catch (err) {
  //   res.status(500).json({ error: 'error writing to config file ' + err });
  // }

  // res.status(204).send();

  exec(`canopy configure -an ${data.accountNumber} -dID ${data.distributionId} -ep ${data.httpEndpoint} -sk ${data.secretKey} -r ${data.region}`, (error, stdout, stderr) => {
    if (error) {
      console.log('error: ', error);
    }
    if (stderr) {
      console.log('stderr: ', stderr);
    }
    console.log('stdout: ', stdout);
  });
  console.log('DESTROY');
  res.status(204).json({ message: 'success' });
});

export default router;
