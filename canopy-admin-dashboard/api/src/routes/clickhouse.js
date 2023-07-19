import { Router } from "express";
import 'dotenv/config';
import axios from "axios";
import fs from 'fs';
import path from 'path';
const { clickhousePort, host} = JSON.parse(fs.readFileSync(path.join(__dirname, '/../../../../src/constants/grafana-config.json')));

const router = Router();

const CLICKHOUSE_URL = `http://${host}:${clickhousePort}`;
console.log("clickhouse url", CLICKHOUSE_URL)

router.get('/stats', async (req, res) => {
  let result;
  try {
    // Ping Database
    const p1 = axios.get(`${CLICKHOUSE_URL}/ping`);
    // Count all grafana Queries
    const p2 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20count(query_id)%20FROM%20system.query_log%20WHERE%20client_name%20ILIKE%20%27%25grafana%25%27`);
    // Get USED disk space
    const p3 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20value%20FROM%20system.asynchronous_metrics%20WHERE%20metric%20LIKE%20'%25DiskUsed%25'`);
    // Get AVAILABLE disk space
    const p4 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20value%20FROM%20system.asynchronous_metrics%20WHERE%20metric%20LIKE%20'%25DiskUnreserved%25'`);
    // Get TOTAL disk space
    const p5 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20value%20FROM%20system.asynchronous_metrics%20WHERE%20metric%20LIKE%20'%25DiskTotal%25'`);
    
    // Get allocated memory
    const p6 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20value%20FROM%20system.metrics%20WHERE%20metric%20%3D%20'MemoryTracking'`);
    // Get uptime
    const p7 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20value%20FROM%20system.asynchronous_metrics%20WHERE%20metric%20%3D%20'Uptime'`);
    // Get database creation date
    const p8 = axios.get(`${CLICKHOUSE_URL}?query=SELECT%20min(event_date)%20FROM%20system.query_log`);

    const promises = [p1, p2, p3, p4, p5, p6, p7, p8];

    result = await Promise.allSettled(promises);
  } catch(err) {
    return res.status(500).send({error: "Error fetching ClickHouse stats " + err})
  }
  const stats = {};
  try {
    stats["status"] = result[0].value.data;
    stats["total Grafana queries"] = result[1].value.data;
    stats["disk used (bytes)"] = result[2].value.data;
    stats["disk available (bytes)"] = result[3].value.data;
    stats["disk total (bytes)"] = result[4].value.data;
    stats["allocated memory (bytes)"] = result[5].value.data;
    stats["uptime (minutes)"] = parseInt(result[6].value.data);
    stats["creation date"] = result[7].value.data;
  } catch (err) {
    return res.status(500).json({error: "error fetching ClickHouse data"})
  }
  return res.status(200).json(stats);
})

export default router;