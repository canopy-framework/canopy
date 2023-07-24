import fs from 'fs';
import path from 'path';
import { Router } from 'express';
// import { Pool } from "pg";

// const pool = new Pool({
//   user: "alexanderriviere",
//   database: "grafdb",
//   password: "password",
//   port: 5432,
//   host: "localhost",
// });

const router = Router();

const getCloudFrontInfo = async () => {
  const awsConfigData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'aws-config.json')));
  let distributionData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'cloudfront-distributions.json'))).map((distObject) => distObject.distributionId);
  distributionData.unshift(awsConfigData.distributionId);

  // try {
  //   const res = await pool.query("SELECT * FROM logs");
  //   console.log("ROWS", res.rows);
  // } catch (error) {
  //   console.error(error);
  // }
  // res looked like this [
  //   { id: 1, time: 2016-06-22T23:10:25.000Z, timetofirstbytems: 32 },
  //   { id: 2, time: 2023-06-22T23:10:25.000Z, timetofirstbytems: 32 },
  // ]
  
  let info = [];

  try {
    distributionData.forEach((id, index) => {
      info[index] = {};
      info[index]['distributionId'] = id;
      info[index]['region'] = awsConfigData.region;
      info[index]['deployed'] = String(!!awsConfigData['deployed']);
      
    });
  } catch (err) {
    return { error: 'Error fetching CloudFront info ' + err };
  }
  return info; //so now just make sure that info matches the format below
  // return [{distributionId: 'sdfsd', region: 'us-east-1', deployed: 'false'}, {distributionId: 'sdfsd', region: 'us-east-1', deployed: 'falsey babe'}, {distributionId: 'sdfsd', region: 'us-east-1', deployed: 'falsey babadfe'}, {distributionId: 'sdfsd', region: 'us-east-1', deployed: 'falsey boasdf'}];
};

router.get('/info', async (req, res) => {
  let info;
  try {
    info = await getCloudFrontInfo();
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).json(info);
});

export default router;
