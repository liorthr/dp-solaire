import { execSync } from "node:child_process";
execSync("npx vitest run -c vitest.record.config.ts", { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
