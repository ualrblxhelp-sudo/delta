import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  type MessageCreateOptions,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js";

import type { DeltaCoreContext } from "./index.js";
import { DELTA_GUILDS, DELTA_GUILD_MAP, type DeltaGuildConfig } from "./server-config.js";

const academyDepartmentChoices = [
  "In-Flight & Customer Services",
  "Flight Operations",
  "Ground Operations"
] as const;

const academyLocationChoices = ["HQ", "GFK", "LGB", "EWR", "SLC", "MTJ"] as const;

const academyDepartmentRouting = {
  "Ground Operations": {
    roleId: "965637523240005673",
    announcementChannelId: "965460985118871593"
  },
  "In-Flight & Customer Services": {
    roleId: "965635494601965648",
    announcementChannelId: "965460648664391741"
  },
  "Flight Operations": {
    roleId: "965635417938481282",
    announcementChannelId: "1379940357415899266"
  }
} as const;

const academyGraduationLogThreadId = "1537637855742926918";

type CommandRoute = {
  commandName: string;
  subcommandName?: string;
};

type AcademyDepartment = keyof typeof academyDepartmentRouting;
type AcademySessionRow = {
  id: string;
  guild_id: string;
  department: AcademyDepartment;
  location: string;
  stage: string;
  timestamp_text: string;
  host_discord_user_id: string;
  host_display_name: string;
  announcement_channel_id: string;
  announcement_message_id: string;
  created_by_discord_user_id: string;
  created_at: string;
};

type AcademyGraduationLogInsert = {
  guild_id: string;
  department: AcademyDepartment;
  instructor_discord_user_id: string;
  trainee_discord_user_id: string;
  trainee_display_name: string;
  log_thread_id: string;
  log_message_id: string;
  created_by_discord_user_id: string;
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
                .setDescription("The instructor responsible for the trainee's graduation.")
                .setRequired(true)
            )
            .addUserOption((option) =>
              option
                .setName("trainee")
                .setDescription("The trainee who has graduated.")
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
                .setName("timestamp")
                .setDescription("The session timestamp text to include in the announcement.")
                .setRequired(true)
            )
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

function isAcademyDepartment(value: string): value is AcademyDepartment {
  return value in academyDepartmentRouting;
}

function buildAcademySessionsDescription(lines: string[]): string {
  const sessionLines =
    lines.length > 0
      ? lines
      : ["-# — No training sessions are currently available for your department roles."];

  return [
    "### <:DLplane:1531850073841864735> Training Session Schedule",
    "> -# All Scheduled Training Sessions **—** For Your Department",
    "-# _ _",
    "<:whitedot:1492002923033657405>**Below** is a list of all training sessions available to you, listing the date, time, and if applicable, stage for your training. Please ensure to attend the necessary sessions required for graduation. If you see an active session, check your **#**notices page to view information regarding a session.",
    "-# _ _",
    "### <:DLacademy19:1532393117041561751> Session Calendar ",
    ...sessionLines
  ].join("\n");
}

async function deleteAcademySessionByMessageId(
  context: DeltaCoreContext,
  announcementMessageId: string
): Promise<void> {
  const { error } = await context.supabase
    .from("academy_sessions")
    .delete()
    .eq("announcement_message_id", announcementMessageId);

  if (error) {
    throw error;
  }
}

async function getCurrentHostDisplayName(
  interaction: ChatInputCommandInteraction,
  session: AcademySessionRow
): Promise<string> {
  if (!interaction.inCachedGuild()) {
    return session.host_display_name;
  }

  const member = await interaction.guild.members
    .fetch(session.host_discord_user_id)
    .catch(() => null);

  return member?.displayName ?? session.host_display_name;
}

async function handleAcademySessions(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      ephemeral: true,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const visibleDepartments = Object.entries(academyDepartmentRouting)
    .filter(([, route]) => member.roles.cache.has(route.roleId))
    .map(([department]) => department as AcademyDepartment);

  if (visibleDepartments.length === 0) {
    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setDescription(buildAcademySessionsDescription([]))
          .setFooter({ text: `${guildConfig.name} • Training Information` })
      ]
    });
    return;
  }

  const { data, error } = await context.supabase
    .from("academy_sessions")
    .select("*")
    .eq("guild_id", guildConfig.id)
    .in("department", visibleDepartments)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const sessions = (data ?? []) as AcademySessionRow[];
  const sessionLines: string[] = [];

  for (const session of sessions) {
    const channel = await interaction.guild.channels
      .fetch(session.announcement_channel_id)
      .catch(() => null);

    if (!channel?.isTextBased() || !("messages" in channel)) {
      await deleteAcademySessionByMessageId(context, session.announcement_message_id);
      continue;
    }

    const message = await channel.messages
      .fetch(session.announcement_message_id)
      .catch(() => null);

    if (!message) {
      await deleteAcademySessionByMessageId(context, session.announcement_message_id);
      continue;
    }

    const hostDisplayName = await getCurrentHostDisplayName(interaction, session);

    sessionLines.push(
      `-# — **@**${hostDisplayName} | ${session.timestamp_text} | Stage ${session.stage}`
    );
  }

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setDescription(buildAcademySessionsDescription(sessionLines))
        .setFooter({ text: `${guildConfig.name} • Training Information` })
    ]
  });
}

async function handleInstructorLog(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      ephemeral: true,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const instructorUser = interaction.options.getUser("user", true);
  const traineeUser = interaction.options.getUser("trainee", true);
  const departmentValue = interaction.options.getString("department", true);

  if (!isAcademyDepartment(departmentValue)) {
    await interaction.reply({
      ephemeral: true,
      content: "That department is not configured for instructor logs."
    });
    return;
  }

  const logThread = await interaction.guild.channels.fetch(academyGraduationLogThreadId);

  if (!logThread?.isTextBased() || !("send" in logThread)) {
    await interaction.reply({
      ephemeral: true,
      content: "The graduation log thread is unavailable right now."
    });
    return;
  }

  const traineeMember = await interaction.guild.members.fetch(traineeUser.id).catch(() => null);
  const traineeDisplayName =
    traineeMember?.displayName ?? traineeUser.displayName ?? traineeUser.username;
  const timestamp = Math.floor(Date.now() / 1000);

  const description = [
    "### <:DLplane:1531850073841864735> Training Log",
    "> -# Graduation Storage ",
    "-# _ _",
    "<:whitedot:1492002923033657405>This trainee has officially graduated from the Delta Training Curriculum, officially entering Delta Air Lines' employee system.",
    "-# _ _",
    `-# — **@**${traineeDisplayName} | <t:${timestamp}:F>`
  ].join("\n");

  const message = await logThread.send({
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setDescription(description)
        .setFooter({ text: `${guildConfig.name} • Training Information` })
    ]
  });

  const insertPayload: AcademyGraduationLogInsert = {
    guild_id: guildConfig.id,
    department: departmentValue,
    instructor_discord_user_id: instructorUser.id,
    trainee_discord_user_id: traineeUser.id,
    trainee_display_name: traineeDisplayName,
    log_thread_id: academyGraduationLogThreadId,
    log_message_id: message.id,
    created_by_discord_user_id: interaction.user.id
  };

  const { error } = await context.supabase
    .from("academy_graduation_logs")
    .insert(insertPayload);

  if (error) {
    await message.delete().catch(() => null);
    throw error;
  }

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setTitle("Training Log Stored")
        .setDescription("The trainee graduation log has been posted and saved.")
        .addFields(
          { name: "Department", value: departmentValue, inline: true },
          { name: "Instructor", value: instructorUser.displayName, inline: true },
          { name: "Trainee", value: traineeDisplayName, inline: true }
        )
        .setFooter({ text: guildConfig.name })
    ]
  });
}

async function handleInstructorSessionCreate(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      ephemeral: true,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const hostUser = interaction.options.getUser("host_instructor", true);
  const location = interaction.options.getString("location", true);
  const departmentValue = interaction.options.getString("department", true);
  const timestamp = interaction.options.getString("timestamp", true);
  const stage = interaction.options.getString("stage", true);

  if (!isAcademyDepartment(departmentValue)) {
    await interaction.reply({
      ephemeral: true,
      content: "That department is not configured for session creation."
    });
    return;
  }

  const departmentRoute = academyDepartmentRouting[departmentValue];
  const announcementChannel = await interaction.guild.channels.fetch(
    departmentRoute.announcementChannelId
  );

  if (!announcementChannel?.isTextBased() || !("send" in announcementChannel)) {
    await interaction.reply({
      ephemeral: true,
      content: "The announcement channel for that department is unavailable right now."
    });
    return;
  }

  const hostMember = await interaction.guild.members.fetch(hostUser.id).catch(() => null);
  const hostDisplayName =
    hostMember?.displayName ?? hostUser.displayName ?? hostUser.username;

  const finalAnnouncement = [
    "### <:DLplane:1531850073841864735> A Training Session has been Scheduled",
    `> -# New Training Session - ${departmentValue}`,
    "-# _ _",
    "<:whitedot:1492002923033657405>Hello! If you are reading this, a training session has been scheduled. Please schedule yourself and allocate time accordingly for attendance. If you are able to attend, react with <:DLacademy11:1532393138566725773>, and if you cannot attend, react with <:DLacademy18:1532393120841334894>.Thank you for your cooperation.",
    "-# _ _",
    "### <:DLacademy19:1532393117041561751>Session Information ",
    `-# — ${timestamp}`,
    `-# — Stage ${stage}`,
    `-# — Hosted by **@**${hostDisplayName}`
  ].join("\n");

  const ghostPingAnnouncement = `<@&${departmentRoute.roleId}>\n${finalAnnouncement}`;

  const messagePayload: MessageCreateOptions = {
    content: ghostPingAnnouncement,
    allowedMentions: { roles: [departmentRoute.roleId] }
  };

  const message = await announcementChannel.send(messagePayload);

  await message.edit({
    content: finalAnnouncement,
    allowedMentions: { parse: [] }
  });

  await message.react("<:DLacademy11:1532393138566725773>");
  await message.react("<:DLacademy18:1532393120841334894>");

  const { error } = await context.supabase.from("academy_sessions").insert({
    guild_id: guildConfig.id,
    department: departmentValue,
    location,
    stage,
    timestamp_text: timestamp,
    host_discord_user_id: hostUser.id,
    host_display_name: hostDisplayName,
    announcement_channel_id: departmentRoute.announcementChannelId,
    announcement_message_id: message.id,
    created_by_discord_user_id: interaction.user.id
  });

  if (error) {
    await message.delete().catch(() => null);
    throw error;
  }

  await interaction.reply({
    ephemeral: true,
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setTitle("Training Session Created")
        .setDescription("The training session has been announced and the department was ghost pinged.")
        .addFields(
          { name: "Department", value: departmentValue, inline: true },
          { name: "Location", value: location, inline: true },
          { name: "Stage", value: stage, inline: true },
          { name: "Timestamp", value: timestamp, inline: false },
          { name: "Host", value: hostDisplayName, inline: true },
          { name: "Channel", value: `<#${departmentRoute.announcementChannelId}>`, inline: true }
        )
        .setFooter({ text: guildConfig.name })
    ]
  });
}

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  context: DeltaCoreContext
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

  if (route.commandName === "academy" && route.subcommandName === "sessions") {
    await handleAcademySessions(interaction, guildConfig, context);
    return;
  }

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

  if (route.commandName === "instructor" && route.subcommandName === "sessioncreate") {
    await handleInstructorSessionCreate(interaction, guildConfig, context);
    return;
  }

  if (route.commandName === "instructor" && route.subcommandName === "log") {
    await handleInstructorLog(interaction, guildConfig, context);
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
