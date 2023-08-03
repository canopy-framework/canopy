import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { listAllDistributions } from '../database/crud';

const router = Router();

const getCloudFrontInfo = async () => {
  const awsConfigData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'aws-config.json')));

  let distributionData = [];

  const rows = await listAllDistributions();
  distributionData.push(...rows.map((row) => row.distributionId));

  let info = [];

  distributionData.forEach((id, index) => {
    info[index] = {};
    info[index]['distributionId'] = id;
    info[index]['region'] = awsConfigData.region;
  });

  return info;
};

router.get('/info', async (req, res) => {
  let info;
  try {
    info = await getCloudFrontInfo();
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
  return res.status(200).json(info);
});

export default router;
