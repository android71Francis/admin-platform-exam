import { createApp } from './app';

const port = parseInt(process.env.PORT || '4000', 10);
const app = createApp();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
