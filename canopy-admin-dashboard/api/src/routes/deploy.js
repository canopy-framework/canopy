import { Router } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
const filePath = '../aws-config.json';
// import axios from 'axios';

const router = Router();

// INFRASTRUCTURE
router.post('/', function (req, res) {
  exec(`canopy deploy`, (error, stdout, stderr) => {
    if (error) {
      console.log('error: ', error);
    }
    if (stderr) {
      console.log('stderr: ', stderr);
    }
    console.log('stdout: ', stdout);
  });
  console.log('DEPLOY');
  res.status(204).json({ message: 'success' });
});

export default router;
