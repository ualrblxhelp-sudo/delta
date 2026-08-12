import { Client, GatewayIntentBits } from "discord.js";
import { createClient } from "@supabase/supabase-js";

import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = loadConfig();

  const supabase = createClient(config.supabaseUrl, config.supabaseSecretKey);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  client.once("ready", async () => {
    console.log(`Delta Core is online as ${client.user?.tag ?? "unknown-user"}.`);
    console.log("Supabase client initialized and ready for feature modules.");
  });

  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error("Delta Core failed to start.");
  console.error(error);
  process.exit(1);
});
