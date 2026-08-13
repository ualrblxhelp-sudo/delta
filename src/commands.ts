import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js";

import { DELTA_GUILDS, DELTA_GUILD_MAP, type DeltaGuildConfig } from "./server-config.js";

const academyDepartmentChoices = [
  "In-Flight & Customer Services",
  "Flight Operations",
  "Ground Operations"
] as const;

const academyLocationChoices = ["HQ", "GFK", "LGB", "EWR", "SLC", "MTJ"] as const;

type CommandRoute = {
  commandName: string;
  subcommandName?: string;
};

function createPlaceholderEmbed(
  guildConfig: DeltaGuildConfig,
  commandPath: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(guildConfig.embedColor)
    .setTitle(`${commandPath} Placeholder`)
    .setDescription("This command has been registered successfully, but its behavior is not implemented yet.")
    .setFooter({ text: guildConfig.name });
}

function getGuildCommands(guildId: string): RESTPostAPIApplicationCommandsJSONBody[] {
  if (guildId === DELTA_GUILDS.airLines.id) {
    return [
      new SlashCommandBuilder()
        .setName("skymiles")
        .setDescription("Placeholder command for SkyMiles features.")
        .toJSON(),
      new SlashCommandBuilder()
        .setName("flight")
        .setDescription("Flight-related community tools.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("review")
            .setDescription("Placeholder command for flight reviews.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("bugs")
            .setDescription("Placeholder command for flight bug reports.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("suggest")
            .setDescription("Placeholder command for flight suggestions.")
        )
        .toJSON()
    ];
  }

  if (guildId === DELTA_GUILDS.flightAcademy.id) {
    return [
      new SlashCommandBuilder()
        .setName("academy")
        .setDescription("Delta Flight Academy tools.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("sessions")
            .setDescription("Placeholder command for academy sessions.")
        )
        .toJSON(),
      new SlashCommandBuilder()
        .setName("instructor")
        .setDescription("Instructor management tools.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("lookup")
            .setDescription("Look up an instructor by Discord ID.")
            .addStringOption((option) =>
              option
                .setName("discord_id")
                .setDescription("The instructor's Discord user ID.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("attendance")
            .setDescription("Record placeholder attendance details.")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user being marked for attendance.")
                .setRequired(true)
            )
            .addUserOption((option) =>
              option
                .setName("instructor")
                .setDescription("The instructor responsible for the session.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("log")
            .setDescription("Create a placeholder instructor log entry.")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The instructor being logged.")
                .setRequired(true)
            )
            .addStringOption((option) => {
              option
                .setName("department")
                .setDescription("The department for the log.")
                .setRequired(true);

              for (const choice of academyDepartmentChoices) {
                option.addChoices({ name: choice, value: choice });
              }

              return option;
            })
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("sessioncreate")
            .setDescription("Create a placeholder training session.")
            .addUserOption((option) =>
              option
                .setName("host_instructor")
                .setDescription("The host instructor for the session.")
                .setRequired(true)
            )
            .addStringOption((option) => {
              option
                .setName("location")
                .setDescription("The academy session location.")
                .setRequired(true);

              for (const choice of academyLocationChoices) {
                option.addChoices({ name: choice, value: choice });
              }

              return option;
            })
            .addStringOption((option) => {
              option
                .setName("department")
                .setDescription("The department running the session.")
                .setRequired(true);

              for (const choice of academyDepartmentChoices) {
                option.addChoices({ name: choice, value: choice });
              }

              return option;
            })
            .addStringOption((option) =>
              option
                .setName("stage")
                .setDescription("The stage label for this training session.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("trainingpanel")
            .setDescription("Open the placeholder training panel.")
        )
        .toJSON()
    ];
  }

  return [];
}

export function buildGuildCommandPayloads(): Map<string, RESTPostAPIApplicationCommandsJSONBody[]> {
  return new Map(
    Array.from(DELTA_GUILD_MAP.keys(), (guildId) => [guildId, getGuildCommands(guildId)])
  );
}

async function memberMeetsMinimumRole(
  interaction: ChatInputCommandInteraction,
  minimumRoleId: string
): Promise<boolean> {
  if (!interaction.inCachedGuild()) {
    return false;
  }

  const member = interaction.member as GuildMember;
  const minimumRole = await interaction.guild.roles.fetch(minimumRoleId);

  if (!minimumRole) {
    return false;
  }

  return (
    member.roles.cache.has(minimumRoleId) ||
    member.roles.highest.comparePositionTo(minimumRole) >= 0
  );
}

function getCommandRoute(interaction: ChatInputCommandInteraction): CommandRoute {
  return {
    commandName: interaction.commandName,
    subcommandName: interaction.options.getSubcommand(false) ?? undefined
  };
}

function isInstructorRestrictedRoute(route: CommandRoute): boolean {
  return route.commandName === "instructor" && route.subcommandName !== undefined;
}

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "This command can only be used inside a Discord server."
    });
    return;
  }

  const guildConfig = DELTA_GUILD_MAP.get(guildId);

  if (!guildConfig) {
    await interaction.reply({
      ephemeral: true,
      content: "This server is not configured for Delta Core yet."
    });
    return;
  }

  const route = getCommandRoute(interaction);

  if (
    isInstructorRestrictedRoute(route) &&
    guildConfig.minimumInstructorRoleId &&
    !(await memberMeetsMinimumRole(interaction, guildConfig.minimumInstructorRoleId))
  ) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setTitle("Access Denied")
          .setDescription("You do not have the minimum instructor rank required to use this command.")
          .setFooter({ text: guildConfig.name })
      ]
    });
    return;
  }

  const commandPath = route.subcommandName
    ? `/${route.commandName} ${route.subcommandName}`
    : `/${route.commandName}`;

  await interaction.reply({
    ephemeral: true,
    embeds: [createPlaceholderEmbed(guildConfig, commandPath)]
  });
}
