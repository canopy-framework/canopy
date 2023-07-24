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
  // return info; so now just make sure that info matches the format below
  return [{distributionId: 'sdfsd', region: 'us-east-1', deployed: 'false'}, {distributionId: 'sdfsd', region: 'us-east-1', deployed: 'falsey babe'}, {distributionId: 'sdfsd', region: 'us-east-1', deployed: 'falsey babadfe'}, {distributionId: 'sdfsd', region: 'us-east-1', deployed: 'falsey boasdf'}];
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
