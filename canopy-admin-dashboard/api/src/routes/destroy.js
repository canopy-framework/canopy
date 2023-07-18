import { Router } from 'express';
import { exec } from 'child_process';
// import axios from 'axios';

const router = Router();

// INFRASTRUCTURE
router.post('/', function (req, res) {
  exec(`canopy destroy`, (error, stdout, stderr) => {
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
