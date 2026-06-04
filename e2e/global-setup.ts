import { resolve } from "path";
import { existsSync } from "fs";

async function globalSetup() {
  const envPath = resolve(__dirname, ".env");
  if (existsSync(envPath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: envPath });
    console.log("✅ Loaded credentials from e2e/.env");
  } else {
    console.warn("⚠️  e2e/.env not found — set ADMIN_EMAIL and ADMIN_PASSWORD manually");
  }
}

export default globalSetup;
