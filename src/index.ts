import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { createClient } from "@supabase/supabase-js";

import { buildGuildCommandPayloads, handleChatInputCommand } from "./commands.js";
import { loadConfig } from "./config.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const commandPayloads = buildGuildCommandPayloads();

  const supabase = createClient(config.supabaseUrl, config.supabaseSecretKey);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  client.once("ready", async () => {
    console.log(`Delta Core is online as ${client.user?.tag ?? "unknown-user"}.`);
    console.log("Supabase client initialized and ready for feature modules.");

    for (const [guildId, commands] of commandPayloads) {
      await rest.put(Routes.applicationGuildCommands(config.discordClientId, guildId), {
        body: commands
      });

      console.log(`Registered ${commands.length} command(s) for guild ${guildId}.`);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    try {
      await handleChatInputCommand(interaction);
    } catch (error) {
      console.error("Delta Core failed to handle an interaction.");
      console.error(error);

      const fallbackMessage = {
        ephemeral: true,
        content: "Something went wrong while handling that command."
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(fallbackMessage);
      } else {
        await interaction.reply(fallbackMessage);
      }
    }
  });

  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error("Delta Core failed to start.");
  console.error(error);
  process.exit(1);
});
