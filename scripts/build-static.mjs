// Build 100 % statique (GitHub Pages / CDN) : les routes serveur /api sont mises de côté le temps du build.
import { execSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const api = "src/app/api";
const parked = "src/_api_parked";
const moved = existsSync(api);
if (moved) renameSync(api, parked);
try {
  execSync("next build", { stdio: "inherit", env: { ...process.env, DEPLOY_TARGET: "static" } });
} finally {
  if (moved) renameSync(parked, api);
}
