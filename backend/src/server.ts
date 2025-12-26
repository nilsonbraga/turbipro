import { app } from './app';
import { env } from './config/env';

const port = env.port;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API executando em http://localhost:${port}`);
});
