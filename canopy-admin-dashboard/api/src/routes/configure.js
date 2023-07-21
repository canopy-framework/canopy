import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
const execProm = promisify(exec);
const router = Router();

router.post('/setAWSInfo', async (req, res) => {
  const data = req.body.data;
  console.log(data);

  try {
    const { stdout } = await execProm(`
    canopy configure -an ${data.accountNumber} -dID ${data.distributionId} -sk ${data.secretKey} -r ${data.region} -ak ${data.accessKeyId}`);
    console.log('stdout: ', stdout);
  } catch (error) {
    console.log('error: ', error);
    return res
      .status(404)
      .json({ error: 'There was an error setting the configuration details.' });
  }

  res.status(204).json({ message: 'success' });
});

export default router;
