import cloudfront from './cloudfront';
import grafana from './grafana';
import clickhouse from './clickhouse';
import alert from './alert';
import configure from './configure';
import deploy from './deploy';
import destroy from './destroy';

export default {
  cloudfront,
  grafana,
  alert,
  clickhouse,
  configure,
  deploy,
  destroy
};
