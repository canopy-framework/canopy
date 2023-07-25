import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  database: "dashboard_storage",
  port: 5432,
  host: "localhost",
});

const router = Router();

const getCloudFrontInfo = async () => {
  const awsConfigData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'aws-config.json')));
  // let distributionData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'cloudfront-distributions.json'))).map((distObject) => distObject.distributionId);
  // distributionData.unshift(awsConfigData.distributionId);

  let distributionData = [];

  const res = await pool.query("SELECT * FROM cdn_distributions");
  distributionData.push(...res.rows.map((row) => row.distribution_id));
  
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
