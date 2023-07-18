const AWS_CONFIG_PATH = process.env.AWS_CONFIG_PATH;
import fs from 'fs';
import { Router } from 'express';

const router = Router();

const getCloudFrontInfo = () => {
  const awsConfigData = JSON.parse(fs.readFileSync(AWS_CONFIG_PATH));

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
