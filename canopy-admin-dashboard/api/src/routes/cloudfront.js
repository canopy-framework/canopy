import fs from 'fs';
import path from 'path';
import { Router } from 'express';

const router = Router();

const getCloudFrontInfo = () => {
  const awsConfigData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'aws-config.json')));
  const info = {};
  try {
    info['distributionId'] = awsConfigData.distributionId;
    info['region'] = awsConfigData.region;
    info['deployed'] = String(awsConfigData['deployed']);
  } catch (err) {
    return { error: 'Error fetching CloudFront info ' + err };
  }
  return info;
};

router.get('/info', (req, res) => {
  let info;
  try {
    info = getCloudFrontInfo();
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).json(info);
});

export default router;
