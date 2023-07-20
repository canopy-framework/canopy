import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
const execProm = promisify(exec);

const router = Router();

// INFRASTRUCTURE
router.post('/', async function (req, res) {
  try {
    const { stdout } = await execProm(`canopy destroy`);
    console.log('stdout: ', stdout);
  } catch (error) {
    console.log('error: ', error);
    return res.status(404).json({ error: 'There was an error destroying' });
  }
  return res.status(204).json({ message: 'success' });
});

export default router;
