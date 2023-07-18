import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import routes from './routes';
import path from 'path';

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use('/cloudfront', routes.cloudfront);
app.use('/grafana', routes.grafana);
app.use('/clickhouse', routes.clickhouse);
app.use('/alert', routes.alert);
app.use('/configure', routes.configure);
app.use('/deploy', routes.deploy);
app.use('/destroy', routes.destroy);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log('Temp Admin Dashboard Server listening on port ' + PORT);
});
