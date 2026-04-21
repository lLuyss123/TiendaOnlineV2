import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.info(`SportStore API running on http://localhost:${env.PORT}`);
});
