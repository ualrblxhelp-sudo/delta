import { Client, GatewayIntentBits, MessageFlags, REST, Routes } from "discord.js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  buildGuildCommandPayloads,
  handleChatInputCommand,
  handleMessageComponentInteraction,
  handleModalSubmitInteraction
} from "./commands.js";
import { loadConfig } from "./config.js";

export type DeltaCoreContext = {
  supabase: SupabaseClient;
};

async function main(): Promise<void> {
  const config = loadConfig();
  const commandPayloads = buildGuildCommandPayloads();

  const supabase = createClient(config.supabaseUrl, config.supabaseSecretKey);
  const context: DeltaCoreContext = { supabase };
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  client.once("clientReady", async () => {
    console.log(`Delta Core is online as ${client.user?.tag ?? "unknown-user"}.`);
    console.log("Supabase client initialized and ready for feature modules.");

    for (const [guildId, commands] of commandPayloads) {
      try {
        await rest.put(Routes.applicationGuildCommands(config.discordClientId, guildId), {
          body: commands
        });

        console.log(`Registered ${commands.length} command(s) for guild ${guildId}.`);
      } catch (error) {
        console.error(`Failed to register commands for guild ${guildId}.`);
        console.error(error);
      }
    }
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleChatInputCommand(interaction, context);
        return;
      }

      if (interaction.isButton() || interaction.isStringSelectMenu()) {
        await handleMessageComponentInteraction(interaction, context);
        return;
      }

      if (interaction.isModalSubmit()) {
        await handleModalSubmitInteraction(interaction, context);
      }
    } catch (error) {
      console.error("Delta Core failed to handle an interaction.");
      console.error(error);

      if (!interaction.isRepliable()) {
        return;
      }

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
