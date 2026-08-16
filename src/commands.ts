import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
  type MessageCreateOptions
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

const academyLocationLinks = {
  HQ: "https://www.roblox.com/games/18976163042/Delta-Air-Lines-Headquarters",
  GFK: "https://www.roblox.com/games/9823318733",
  LGB: "https://www.roblox.com/games/126308219788176",
  EWR: "https://www.roblox.com/games/114618204842375",
  SLC: "https://www.roblox.com/games/15850684663",
  MTJ: "https://www.roblox.com/games/135553927200546"
} as const satisfies Record<(typeof academyLocationChoices)[number], string>;

const academyGraduationLogThreadId = "1537637855742926918";
const academyAttendanceLogThreadId = "1537637786817921104";
const academyDisciplineLogThreadId = "1537712022291222539";
const deltaStaffOpsRoleId = "1538337702611787776";
const deltaStaffHrRoleId = "1538337661318729850";
const deltaStaffFlightAnnouncementChannelId = "968712873067032607";

const academyPanelPrefix = "academy-panel";
const academyPanelPageTrainees = "trainees";
const academyPanelPageSessions = "sessions";
const staffFlightPrefix = "staff-flight";

type CommandRoute = {
  commandName: string;
  subcommandGroupName?: string;
  subcommandName?: string;
};

type AcademyDepartment = keyof typeof academyDepartmentRouting;
type AcademyLocation = (typeof academyLocationChoices)[number];
type AcademySessionStatus = "scheduled" | "started";
type AcademyPanelPage = typeof academyPanelPageTrainees | typeof academyPanelPageSessions;
type AcademyPanelInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ModalSubmitInteraction;

type AcademySessionRow = {
  id: string;
  guild_id: string;
  department: AcademyDepartment;
  location: AcademyLocation;
  stage: string;
  timestamp_text: string;
  host_discord_user_id: string;
  host_display_name: string;
  announcement_channel_id: string;
  announcement_message_id: string;
  commencement_message_id: string | null;
  status: AcademySessionStatus | null;
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

type AcademyAttendanceLogInsert = {
  guild_id: string;
  instructor_discord_user_id: string;
  instructor_display_name: string;
  trainee_discord_user_ids: string[];
  trainee_display_names: string[];
  log_thread_id: string;
  log_message_id: string;
  created_by_discord_user_id: string;
};

type StaffFlightType = "regular" | "premium" | "test" | "private";
type StaffFlightCategoryKey =
  | "supervisory"
  | "airport-services"
  | "tarmac-assistance"
  | "flight-attendants"
  | "cockpit";
type StaffFlightRoleKey =
  | "flight-dispatcher"
  | "supervisory-committee"
  | "customer-service"
  | "primary-gate-agent"
  | "secondary-gate-agent"
  | "ground-operations-manager"
  | "ground-operations"
  | "flight-leader"
  | "flight-attendants"
  | "emergency-flight-attendants"
  | "captain"
  | "first-officer"
  | "emergency-flight-crew";

type StaffFlightDraft = {
  ownerId: string;
  guildId: string;
  flightType: StaffFlightType;
  flightNumber?: string;
  departure?: string;
  destination?: string;
  aircraft?: string;
  codeshares?: string;
};

type StaffFlightRow = {
  id: string;
  guild_id: string;
  flight_type: StaffFlightType;
  flight_number: string;
  departure: string;
  destination: string;
  aircraft: string;
  codeshares: string | null;
  departure_gate: string;
  arrival_gate: string;
  briefing_timestamp_text: string;
  check_in_timestamp_text: string;
  announcement_channel_id: string;
  announcement_message_id: string;
  briefing_thread_id: string;
  briefing_message_id: string;
  created_by_discord_user_id: string;
  created_at: string;
};

type StaffFlightAllocationRow = {
  id: string;
  flight_id: string;
  guild_id: string;
  user_discord_id: string;
  role_key: StaffFlightRoleKey;
  role_name: string;
  category_key: StaffFlightCategoryKey;
  created_at: string;
};

type AcademyDisciplineStateRow = {
  id: string;
  guild_id: string;
  trainee_discord_user_id: string;
  trainee_display_name: string;
  warning_points: number;
  terminated_at: string | null;
  last_updated_by_discord_user_id: string;
  created_at: string;
  updated_at: string;
};

type AcademyDisciplineStateUpsert = {
  guild_id: string;
  trainee_discord_user_id: string;
  trainee_display_name: string;
  warning_points: number;
  terminated_at: string | null;
  last_updated_by_discord_user_id: string;
};

type AcademyDisciplineLogInsert = {
  guild_id: string;
  trainee_discord_user_id: string;
  trainee_display_name: string;
  moderator_discord_user_id: string;
  moderator_display_name: string;
  action: "warning" | "termination";
  warning_points_after: number;
  log_thread_id: string;
  log_message_id: string;
};

type AcademyDepartmentTrainees = {
  department: AcademyDepartment;
  members: GuildMember[];
};

type AcademyPanelPayload = {
  embeds: EmbedBuilder[];
  components: Array<
    | ActionRowBuilder<ButtonBuilder>
    | ActionRowBuilder<StringSelectMenuBuilder>
  >;
};

const staffFlightDrafts = new Map<string, StaffFlightDraft>();

const staffFlightCategories = [
  {
    key: "supervisory",
    title: "Supervisory",
    emojiTag: "<:DLstaff21:1532391906846183454>",
    buttonEmoji: { id: "1532391906846183454", name: "DLstaff21" },
    roles: [
      { key: "flight-dispatcher", name: "Flight Dispatcher", max: 1 },
      { key: "supervisory-committee", name: "Supervisory Committee", max: 2 }
    ]
  },
  {
    key: "airport-services",
    title: "Airport Services",
    emojiTag: "<:DLstaff24:1532391937192231073>",
    buttonEmoji: { id: "1532391937192231073", name: "DLstaff24" },
    roles: [
      { key: "customer-service", name: "Customer Service", max: 4 },
      { key: "primary-gate-agent", name: "Primary Gate Agent", max: 1 },
      { key: "secondary-gate-agent", name: "Secondary Gate Agent", max: 1 }
    ]
  },
  {
    key: "tarmac-assistance",
    title: "Tarmac Assistance",
    emojiTag: "<:DLstaff03:1532392191828431079>",
    buttonEmoji: { id: "1532392191828431079", name: "DLstaff03" },
    roles: [
      { key: "ground-operations-manager", name: "Ground Operations Manager", max: 1 },
      { key: "ground-operations", name: "Ground Operations", max: 4 }
    ]
  },
  {
    key: "flight-attendants",
    title: "Flight Attendants",
    emojiTag: "<:DLstaff10:1532392214523805907>",
    buttonEmoji: { id: "1532392214523805907", name: "DLstaff10" },
    roles: [
      { key: "flight-leader", name: "Flight Leader", max: 1 },
      { key: "flight-attendants", name: "Flight Attendants", max: 4 },
      { key: "emergency-flight-attendants", name: "Emergency Flight Attendants", max: 2 }
    ]
  },
  {
    key: "cockpit",
    title: "Cockpit",
    emojiTag: "<:DLstaff28:1532391927079768196>",
    buttonEmoji: { id: "1532391927079768196", name: "DLstaff28" },
    roles: [
      { key: "captain", name: "Captain", max: 1 },
      { key: "first-officer", name: "First Officer", max: 1 },
      { key: "emergency-flight-crew", name: "Emergency Flight Crew", max: 1 }
    ]
  }
] as const satisfies ReadonlyArray<{
  key: StaffFlightCategoryKey;
  title: string;
  emojiTag: string;
  buttonEmoji: { id: string; name: string };
  roles: ReadonlyArray<{ key: StaffFlightRoleKey; name: string; max: number }>;
}>;

const staffFlightCategoryMap = new Map(
  staffFlightCategories.map((category) => [category.key, category])
);

const staffFlightRoleMap = new Map(
  staffFlightCategories.flatMap((category) =>
    category.roles.map((role) => [role.key, { ...role, categoryKey: category.key }])
  )
);

function createPlaceholderEmbed(
  guildConfig: DeltaGuildConfig,
  commandPath: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(guildConfig.embedColor)
    .setTitle(`${commandPath} Placeholder`)
    .setDescription(
      "This command has been registered successfully, but its behavior is not implemented yet."
    )
    .setFooter({ text: guildConfig.name });
}

function buildStaffFlightCustomId(...parts: string[]): string {
  return [staffFlightPrefix, ...parts].join(":");
}

function parseStaffFlightCustomId(customId: string): string[] | null {
  if (!customId.startsWith(`${staffFlightPrefix}:`)) {
    return null;
  }

  return customId.split(":");
}

function buildStaffFlightScheduledDescription(flight: {
  flightNumber: string;
  departure: string;
  destination: string;
  aircraft: string;
  codeshares: string;
  departureGate: string;
  arrivalGate: string;
  checkInTimestamp: string;
  briefingTimestamp: string;
}): string {
  return [
    "> ### <:DLstaff28:1532391927079768196> \uFEFFA Flight Has Been Scheduled",
    "-# Operations Scheduling",
    "### <:DLstaff19:1532391912580055192> Flight Information",
    `-# — **Flight No**: ${flight.flightNumber}`,
    `-# — **${flight.departure}** - **${flight.destination}**`,
    `-# — **Aircraft**: ${flight.aircraft}`,
    `-# — **Codeshares**: ${flight.codeshares}`,
    `-# — **Departure Gate**: ${flight.departureGate}`,
    `-# — **Arrival Gate**: ${flight.arrivalGate}`,
    "### <:DLstaff07:1532392170923757891> Flight Allocation Information",
    `> Hello! A flight has been scheduled for **${flight.checkInTimestamp}**, with a briefing taking place at **${flight.briefingTimestamp}**. If you are interested in attending this flight, please view the briefing sheet by clicking the thread below. You can select a role by clicking the button associated with the department emoji. Once you click on the button, you will be able to choose a **specific** role for your flight. Please note that a host has the authority to adjust your role at any time for the flight.`
  ].join("\n");
}

function formatStaffFlightMentions(allocations: StaffFlightAllocationRow[]): string {
  if (allocations.length === 0) {
    return "Unassigned";
  }

  return allocations
    .map((allocation) => `<@${allocation.user_discord_id}>`)
    .join(", ");
}

function buildStaffFlightBriefingDescription(
  flight: StaffFlightRow,
  allocations: StaffFlightAllocationRow[]
): string {
  const codeshares = flight.codeshares?.trim() ? flight.codeshares : "N/A";
  const lines = [
    "> ### <:DLstaff07:1532392170923757891>\uFEFF\uFEFF Briefing Sheet",
    "-# Information, Roles & Duties",
    "### <:DLstaff19:1532391912580055192> Flight Information",
    `-# — **Flight No**: ${flight.flight_number}`,
    `-# — **${flight.departure}** - **${flight.destination}**`,
    `-# — **Aircraft**: ${flight.aircraft}`,
    `-# — **Codeshares**: ${codeshares}`,
    `-# — **Departure Gate**: ${flight.departure_gate}`,
    `-# — **Arrival Gate**: ${flight.arrival_gate}`,
    "",
    "> <:1277446559105286195:1378904455793348628>Below are your assigned duties and tasks for the upcoming flight. Please identify your role and prepare for our briefing; failure to do so will result in consequences."
  ];

  for (const category of staffFlightCategories) {
    lines.push(`### ${category.emojiTag} ${category.title}`);

    for (const role of category.roles) {
      const roleAllocations = allocations.filter((allocation) => allocation.role_key === role.key);
      lines.push(
        `-# — **${role.name}** (${roleAllocations.length}/${role.max}) | ${formatStaffFlightMentions(roleAllocations)}`
      );
    }
  }

  lines.push("");
  lines.push("<:DLstaff06:1532392173721354351> **Dispatcher Services**");
  lines.push("> -# Delta Air Lines");

  return lines.join("\n");
}

function buildStaffFlightButtons(flightId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...staffFlightCategories.map((category) =>
      new ButtonBuilder()
        .setCustomId(buildStaffFlightCustomId("role-button", flightId, category.key))
        .setLabel(category.title)
        .setEmoji(category.buttonEmoji)
        .setStyle(ButtonStyle.Secondary)
    )
  );
}

function buildStaffFlightTypeSelector(ownerId: string): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(buildStaffFlightCustomId("create-type", ownerId))
      .setPlaceholder("Choose a flight type")
      .addOptions(
        { label: "Regular Flight", value: "regular" },
        { label: "Delta Premium Flight", value: "premium" },
        { label: "Test Flight", value: "test" },
        { label: "Private Flight", value: "private", description: "For a singular passenger." }
      )
  );
}

function buildStaffFlightContinueButton(ownerId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildStaffFlightCustomId("create-continue", ownerId))
      .setLabel("Continue Flight Setup")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function fetchStaffFlightById(
  context: DeltaCoreContext,
  flightId: string
): Promise<StaffFlightRow | null> {
  const { data, error } = await context.supabase
    .from("staff_flights")
    .select("*")
    .eq("id", flightId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as StaffFlightRow | null) ?? null;
}

async function fetchStaffFlightAllocations(
  context: DeltaCoreContext,
  flightId: string
): Promise<StaffFlightAllocationRow[]> {
  const { data, error } = await context.supabase
    .from("staff_flight_allocations")
    .select("*")
    .eq("flight_id", flightId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as StaffFlightAllocationRow[];
}

async function createStaffFlight(
  context: DeltaCoreContext,
  payload: Omit<
    StaffFlightRow,
    "id" | "created_at" | "briefing_message_id" | "briefing_thread_id" | "announcement_message_id"
  > & {
    announcement_message_id: string;
    briefing_thread_id: string;
    briefing_message_id: string;
  }
): Promise<StaffFlightRow> {
  const { data, error } = await context.supabase
    .from("staff_flights")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as StaffFlightRow;
}

async function deleteStaffFlightAllocationForUser(
  context: DeltaCoreContext,
  flightId: string,
  userId: string
): Promise<void> {
  const { error } = await context.supabase
    .from("staff_flight_allocations")
    .delete()
    .eq("flight_id", flightId)
    .eq("user_discord_id", userId);

  if (error) {
    throw error;
  }
}

async function insertStaffFlightAllocation(
  context: DeltaCoreContext,
  payload: Omit<StaffFlightAllocationRow, "id" | "created_at">
): Promise<void> {
  const { error } = await context.supabase.from("staff_flight_allocations").insert(payload);

  if (error) {
    throw error;
  }
}

async function updateStaffBriefingMessage(
  guild: Guild,
  context: DeltaCoreContext,
  flight: StaffFlightRow
): Promise<void> {
  const thread = await guild.channels.fetch(flight.briefing_thread_id).catch(() => null);

  if (!thread?.isTextBased() || !("messages" in thread)) {
    throw new Error("The briefing thread for this flight is unavailable.");
  }

  const briefingMessage = await thread.messages.fetch(flight.briefing_message_id).catch(() => null);

  if (!briefingMessage) {
    throw new Error("The stored briefing sheet message could not be found.");
  }

  const allocations = await fetchStaffFlightAllocations(context, flight.id);

  await briefingMessage.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(DELTA_GUILDS.staff.embedColor)
        .setDescription(buildStaffFlightBriefingDescription(flight, allocations))
        .setFooter({ text: `${DELTA_GUILDS.staff.name} • Dispatcher Services` })
    ],
    allowedMentions: { parse: [] }
  });
}

function isStaffFlightType(value: string): value is StaffFlightType {
  return value === "regular" || value === "premium" || value === "test" || value === "private";
}

function isStaffFlightCategoryKey(value: string): value is StaffFlightCategoryKey {
  return staffFlightCategoryMap.has(value as StaffFlightCategoryKey);
}

function isStaffFlightRoleKey(value: string): value is StaffFlightRoleKey {
  return staffFlightRoleMap.has(value as StaffFlightRoleKey);
}

async function handleStaffOpsFlightCreate(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This command must be used from inside Delta Staff."
    });
    return;
  }

  staffFlightDrafts.delete(interaction.user.id);

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setTitle("Create Flight")
        .setDescription("Choose the flight type to begin the operations scheduling prompt.")
        .setFooter({ text: guildConfig.name })
    ],
    components: [buildStaffFlightTypeSelector(interaction.user.id)]
  });
}

async function showStaffFlightSetupOneModal(
  interaction: StringSelectMenuInteraction,
  ownerId: string,
  flightType: StaffFlightType
): Promise<void> {
  staffFlightDrafts.set(ownerId, {
    ownerId,
    guildId: interaction.guildId ?? DELTA_GUILDS.staff.id,
    flightType
  });

  const modal = new ModalBuilder()
    .setCustomId(buildStaffFlightCustomId("setup-one", ownerId))
    .setTitle("Flight Setup • Part 1");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("flight_number")
        .setLabel("Flight Number")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("departure")
        .setLabel("Departure")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("destination")
        .setLabel("Destination")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("aircraft")
        .setLabel("Aircraft")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("codeshares")
        .setLabel("Codeshares")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setPlaceholder("Optional. Leave blank for N/A.")
    )
  );

  await interaction.showModal(modal);
}

async function showStaffFlightSetupTwoModal(
  interaction: ButtonInteraction,
  ownerId: string
): Promise<void> {
  const draft = staffFlightDrafts.get(ownerId);

  if (!draft?.flightNumber) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Your flight setup draft was not found. Run `/ops flight create` again."
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(buildStaffFlightCustomId("setup-two", ownerId))
    .setTitle("Flight Setup • Part 2");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("departure_gate")
        .setLabel("Departure Gate")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("arrival_gate")
        .setLabel("Arrival Gate")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("briefing_timestamp")
        .setLabel("Briefing Timestamp")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("check_in_timestamp")
        .setLabel("Check-In Timestamp")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );

  await interaction.showModal(modal);
}

async function finalizeStaffFlightCreation(
  interaction: ModalSubmitInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext,
  ownerId: string
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This action must be used inside Delta Staff."
    });
    return;
  }

  const draft = staffFlightDrafts.get(ownerId);

  if (
    !draft?.flightNumber ||
    !draft.departure ||
    !draft.destination ||
    !draft.aircraft
  ) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Your flight setup draft was not found. Run `/ops flight create` again."
    });
    return;
  }

  const departureGate = interaction.fields.getTextInputValue("departure_gate").trim();
  const arrivalGate = interaction.fields.getTextInputValue("arrival_gate").trim();
  const briefingTimestamp = interaction.fields.getTextInputValue("briefing_timestamp").trim();
  const checkInTimestamp = interaction.fields.getTextInputValue("check_in_timestamp").trim();
  const codeshares = draft.codeshares?.trim() ? draft.codeshares.trim() : "N/A";

  const announcementChannel = await interaction.guild.channels
    .fetch(deltaStaffFlightAnnouncementChannelId)
    .catch(() => null);

  if (!announcementChannel?.isTextBased() || !("send" in announcementChannel)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "The staff flight announcement channel is unavailable right now."
    });
    return;
  }

  const announcementEmbed = new EmbedBuilder()
    .setColor(guildConfig.embedColor)
    .setDescription(
      buildStaffFlightScheduledDescription({
        flightNumber: draft.flightNumber,
        departure: draft.departure,
        destination: draft.destination,
        aircraft: draft.aircraft,
        codeshares,
        departureGate,
        arrivalGate,
        checkInTimestamp,
        briefingTimestamp
      })
    )
    .setFooter({ text: `${guildConfig.name} • Operations Scheduling` });

  const announcementMessage = await announcementChannel.send({
    embeds: [announcementEmbed],
    components: [buildStaffFlightButtons("pending")]
  });

  const briefingThread = await announcementMessage.startThread({
    name: `Briefing Sheet | ${draft.flightNumber}`,
    autoArchiveDuration: 1440
  });

  const temporaryFlight: StaffFlightRow = {
    id: "pending",
    guild_id: interaction.guildId,
    flight_type: draft.flightType,
    flight_number: draft.flightNumber,
    departure: draft.departure,
    destination: draft.destination,
    aircraft: draft.aircraft,
    codeshares: codeshares === "N/A" ? null : codeshares,
    departure_gate: departureGate,
    arrival_gate: arrivalGate,
    briefing_timestamp_text: briefingTimestamp,
    check_in_timestamp_text: checkInTimestamp,
    announcement_channel_id: deltaStaffFlightAnnouncementChannelId,
    announcement_message_id: announcementMessage.id,
    briefing_thread_id: briefingThread.id,
    briefing_message_id: "pending",
    created_by_discord_user_id: interaction.user.id,
    created_at: new Date().toISOString()
  };

  const briefingMessage = await briefingThread.send({
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setDescription(buildStaffFlightBriefingDescription(temporaryFlight, []))
        .setFooter({ text: `${guildConfig.name} • Dispatcher Services` })
    ],
    allowedMentions: { parse: [] }
  });

  try {
    const flight = await createStaffFlight(context, {
      guild_id: interaction.guildId,
      flight_type: draft.flightType,
      flight_number: draft.flightNumber,
      departure: draft.departure,
      destination: draft.destination,
      aircraft: draft.aircraft,
      codeshares: codeshares === "N/A" ? null : codeshares,
      departure_gate: departureGate,
      arrival_gate: arrivalGate,
      briefing_timestamp_text: briefingTimestamp,
      check_in_timestamp_text: checkInTimestamp,
      announcement_channel_id: deltaStaffFlightAnnouncementChannelId,
      announcement_message_id: announcementMessage.id,
      briefing_thread_id: briefingThread.id,
      briefing_message_id: briefingMessage.id,
      created_by_discord_user_id: interaction.user.id
    });

    await announcementMessage.edit({
      embeds: [announcementEmbed],
      components: [buildStaffFlightButtons(flight.id)]
    });

    await updateStaffBriefingMessage(interaction.guild, context, flight);
  } catch (error) {
    await briefingThread.delete().catch(() => null);
    await announcementMessage.delete().catch(() => null);
    throw error;
  } finally {
    staffFlightDrafts.delete(ownerId);
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: `The flight has been scheduled and the briefing sheet is live in <#${briefingThread.id}>.`
  });
}

async function showStaffFlightRoleSelector(
  interaction: ButtonInteraction,
  context: DeltaCoreContext,
  flightId: string,
  categoryKey: StaffFlightCategoryKey
): Promise<void> {
  const flight = await fetchStaffFlightById(context, flightId);

  if (!flight) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That flight could not be found."
    });
    return;
  }

  const category = staffFlightCategoryMap.get(categoryKey);

  if (!category) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That flight role category is not configured."
    });
    return;
  }

  const allocations = await fetchStaffFlightAllocations(context, flightId);
  const currentAllocation = allocations.find(
    (allocation) => allocation.user_discord_id === interaction.user.id
  );

  const availableRoles = category.roles.filter((role) => {
    const count = allocations.filter(
      (allocation) =>
        allocation.role_key === role.key &&
        allocation.user_discord_id !== interaction.user.id
    ).length;

    return count < role.max || currentAllocation?.role_key === role.key;
  });

  if (availableRoles.length === 0) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Every role in that category is currently full. Choose a different category."
    });
    return;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: `Choose your ${category.title} role for flight ${flight.flight_number}.`,
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(buildStaffFlightCustomId("role-select", flightId, categoryKey))
          .setPlaceholder("Select your specific role")
          .addOptions(
            availableRoles.map((role) => {
              const count = allocations.filter(
                (allocation) => allocation.role_key === role.key
              ).length;

              return {
                label: role.name,
                value: role.key,
                description: `${count}/${role.max} assigned`
              };
            })
          )
      )
    ]
  });
}

async function assignStaffFlightRole(
  interaction: StringSelectMenuInteraction,
  context: DeltaCoreContext,
  flightId: string,
  categoryKey: StaffFlightCategoryKey,
  roleKey: StaffFlightRoleKey
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.update({
      content: "This role selection must be used inside Delta Staff.",
      components: []
    });
    return;
  }

  const flight = await fetchStaffFlightById(context, flightId);

  if (!flight) {
    await interaction.update({
      content: "That flight could not be found.",
      components: []
    });
    return;
  }

  const role = staffFlightRoleMap.get(roleKey);

  if (!role || role.categoryKey !== categoryKey) {
    await interaction.update({
      content: "That role is not available for this category.",
      components: []
    });
    return;
  }

  const allocations = await fetchStaffFlightAllocations(context, flightId);
  const currentAllocation = allocations.find(
    (allocation) => allocation.user_discord_id === interaction.user.id
  );

  if (currentAllocation?.role_key === roleKey) {
    await interaction.update({
      content: `You are already assigned as ${role.name} for flight ${flight.flight_number}.`,
      components: []
    });
    return;
  }

  const currentCount = allocations.filter(
    (allocation) =>
      allocation.role_key === roleKey && allocation.user_discord_id !== interaction.user.id
  ).length;

  if (currentCount >= role.max) {
    await interaction.update({
      content: "That role just filled up. Please choose a different role.",
      components: []
    });
    return;
  }

  if (currentAllocation) {
    await deleteStaffFlightAllocationForUser(context, flightId, interaction.user.id);
  }

  await insertStaffFlightAllocation(context, {
    flight_id: flightId,
    guild_id: interaction.guildId,
    user_discord_id: interaction.user.id,
    role_key: roleKey,
    role_name: role.name,
    category_key: categoryKey
  });

  await updateStaffBriefingMessage(interaction.guild, context, flight);

  await interaction.update({
    content: `You are now assigned as **${role.name}** for flight **${flight.flight_number}**.`,
    components: []
  });
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
        .setDescription("Access trainee schedules and academy session information.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("sessions")
            .setDescription("View every scheduled training session available to your department roles.")
        )
        .toJSON(),
      new SlashCommandBuilder()
        .setName("instructor")
        .setDescription("Manage academy sessions, attendance, trainees, and training logs.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("attendance")
            .setDescription("Log completed training attendance for one or more trainees.")
            .addUserOption((option) =>
              option
                .setName("instructor")
                .setDescription("Select the instructor who hosted or trained the session.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("trainees")
                .setDescription("Mention or paste every trainee ID, separated by spaces or commas.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("log")
            .setDescription("Store a graduation log for a trainee who completed training.")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("Select the instructor responsible for the trainee's graduation.")
                .setRequired(true)
            )
            .addUserOption((option) =>
              option
                .setName("trainee")
                .setDescription("Select the trainee who has successfully graduated.")
                .setRequired(true)
            )
            .addStringOption((option) => {
              option
                .setName("department")
                .setDescription("Choose the department the trainee graduated into.")
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
            .setDescription("Create, announce, and save a new academy training session.")
            .addUserOption((option) =>
              option
                .setName("host_instructor")
                .setDescription("Select the instructor who will host the training session.")
                .setRequired(true)
            )
            .addStringOption((option) => {
              option
                .setName("location")
                .setDescription("Choose the airport or academy location for the session.")
                .setRequired(true);

              for (const choice of academyLocationChoices) {
                option.addChoices({ name: choice, value: choice });
              }

              return option;
            })
            .addStringOption((option) => {
              option
                .setName("department")
                .setDescription("Choose which academy department this session is for.")
                .setRequired(true);

              for (const choice of academyDepartmentChoices) {
                option.addChoices({ name: choice, value: choice });
              }

              return option;
            })
            .addStringOption((option) =>
              option
                .setName("timestamp")
                .setDescription("Enter the timestamp text that should appear in the announcement.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("stage")
                .setDescription("Enter the stage number or label for this training session.")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("trainingpanel")
            .setDescription("Open the academy control panel for trainees and scheduled sessions.")
        )
        .toJSON()
    ];
  }

  if (guildId === DELTA_GUILDS.staff.id) {
    return [
      new SlashCommandBuilder()
        .setName("ops")
        .setDescription("Operations command center for staff flight tools.")
        .addSubcommandGroup((group) =>
          group
            .setName("flight")
            .setDescription("Flight operations creation tools.")
            .addSubcommand((subcommand) =>
              subcommand
                .setName("create")
                .setDescription("Create, announce, and open allocations for a scheduled flight.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("flightpanel")
            .setDescription("Placeholder command for the operations flight panel.")
        )
        .toJSON(),
      new SlashCommandBuilder()
        .setName("hr")
        .setDescription("Human resources lookup tools for staff.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("getinfo")
            .setDescription("Placeholder command for HR staff information lookups.")
            .addStringOption((option) =>
              option
                .setName("query")
                .setDescription("Enter a Roblox username or Discord ID.")
                .setRequired(true)
            )
        )
        .toJSON(),
      new SlashCommandBuilder()
        .setName("staff")
        .setDescription("General Delta Staff assistance tools.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("inactivity")
            .setDescription("Placeholder command for staff inactivity notices.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("request")
            .setDescription("Placeholder command for staff requests.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("bugfix")
            .setDescription("Placeholder command for staff bug fix reports.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("productrec")
            .setDescription("Placeholder command for staff product recommendations.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("getinfo")
            .setDescription("Placeholder command for general staff information lookups.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("resign")
            .setDescription("Placeholder command for staff resignation submissions.")
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
  interaction: AcademyPanelInteraction,
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
    subcommandGroupName: interaction.options.getSubcommandGroup(false) ?? undefined,
    subcommandName: interaction.options.getSubcommand(false) ?? undefined
  };
}

function isInstructorRestrictedRoute(route: CommandRoute): boolean {
  return route.commandName === "instructor" && route.subcommandName !== undefined;
}

function isStaffOpsRestrictedRoute(route: CommandRoute): boolean {
  return (
    route.commandName === "ops" &&
    ((route.subcommandGroupName === "flight" && route.subcommandName === "create") ||
      route.subcommandName === "flightpanel")
  );
}

function isStaffHrRestrictedRoute(route: CommandRoute): boolean {
  return route.commandName === "hr" && route.subcommandName === "getinfo";
}

function memberHasExactRole(
  interaction: ChatInputCommandInteraction,
  roleId: string
): boolean {
  if (!interaction.inCachedGuild()) {
    return false;
  }

  const member = interaction.member as GuildMember;
  return member.roles.cache.has(roleId);
}

function isAcademyDepartment(value: string): value is AcademyDepartment {
  return value in academyDepartmentRouting;
}

function isAcademyLocation(value: string): value is AcademyLocation {
  return value in academyLocationLinks;
}

function isSessionScheduled(session: AcademySessionRow): boolean {
  return session.status === null || session.status === "scheduled";
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

function buildTrainingPanelTraineesDescription(
  departments: AcademyDepartmentTrainees[],
  warningPoints: Map<string, number>
): string {
  const lines = [
    "### <:DLplane:1531850073841864735> Academy Training Panel",
    "> -# Current Trainees By Department",
    "-# _ _",
    "<:whitedot:1492002923033657405>Use the buttons below to issue a warning or terminate a trainee. Warning points are tracked globally, and two warnings will automatically terminate a trainee."
  ];

  for (const departmentGroup of departments) {
    lines.push("-# _ _");
    lines.push(`### ${departmentGroup.department}`);

    if (departmentGroup.members.length === 0) {
      lines.push("-# — No current trainees.");
      continue;
    }

    for (const member of departmentGroup.members) {
      const points = warningPoints.get(member.id) ?? 0;
      const pointText = points === 1 ? "1 warning" : `${points} warnings`;
      lines.push(`-# — **@**${member.displayName} | ${pointText}`);
    }
  }

  return lines.join("\n");
}

function buildTrainingPanelSessionsDescription(
  sessions: AcademySessionRow[],
  selectedSessionId?: string
): string {
  const lines = [
    "### <:DLplane:1531850073841864735> Academy Training Panel",
    "> -# Scheduled Training Sessions",
    "-# _ _",
    "<:whitedot:1492002923033657405>Use the controls below to start, postpone, or cancel a scheduled training session."
  ];

  if (sessions.length === 0) {
    lines.push("-# _ _");
    lines.push("-# — No scheduled training sessions are currently stored.");
    return lines.join("\n");
  }

  lines.push("-# _ _");
  lines.push("### Session Queue");

  for (const session of sessions) {
    const selectedMarker = session.id === selectedSessionId ? " **(Selected)**" : "";
    lines.push(
      `-# — ${session.department} | ${session.timestamp_text} | Stage ${session.stage} | ${session.location}${selectedMarker}`
    );
  }

  return lines.join("\n");
}

function parseDiscordSnowflakes(value: string): string[] {
  const matches = value.match(/\d{17,20}/g) ?? [];
  return Array.from(new Set(matches));
}

function parseSingleDiscordSnowflake(value: string): string | null {
  return parseDiscordSnowflakes(value)[0] ?? null;
}

function buildAcademySessionAnnouncement(
  department: AcademyDepartment,
  timestampText: string,
  stage: string,
  hostDisplayName: string
): string {
  return [
    "### <:DLplane:1531850073841864735> A Training Session has been Scheduled",
    `> -# New Training Session - ${department}`,
    "-# _ _",
    "<:whitedot:1492002923033657405>Hello! If you are reading this, a training session has been scheduled. Please schedule yourself and allocate time accordingly for attendance. If you are able to attend, react with <:DLacademy11:1532393138566725773>, and if you cannot attend, react with <:DLacademy18:1532393120841334894>.Thank you for your cooperation.",
    "-# _ _",
    "### <:DLacademy19:1532393117041561751>Session Information ",
    `-# — ${timestampText}`,
    `-# — Stage ${stage}`,
    `-# — Hosted by **@**${hostDisplayName}`
  ].join("\n");
}

function buildAcademySessionCommencement(location: AcademyLocation): string {
  return [
    "### <:DLplane:1531850073841864735> Training Session Commencement",
    "> -# Your Training Has Begun",
    "-# _ _",
    "<:whitedot:1492002923033657405>Your training session has begun, please join the indicated experience using the link below",
    "-# _ _",
    "### <:DLacademy19:1532393117041561751>Link to Training Area",
    `-# — [${location}](${academyLocationLinks[location]})`
  ].join("\n");
}

function buildWarningEmbed(guildConfig: DeltaGuildConfig): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(guildConfig.embedColor)
    .setDescription(
      [
        "### <:DLplane:1531850073841864735> Warning Issue",
        "> -# Academy Warning ",
        "",
        "> <:whitedot:1492002923033657405>This message serves as a **warning** message for disrespecting and not following the basic codes of conduct indicated within trainings, Delta's community, and Delta Air Lines' Flight Academy. Another warning will result in **termination** from the Delta Air Lines' Flight Academy.",
        "",
        "-# <:DLacademy06:1532393158242209983> Sent by Emiko Mizuki, Chief Talent Officer & Michael Blair, Chief People Officer"
      ].join("\n")
    )
    .setFooter({ text: `${guildConfig.name} • Warning Notice` });
}

function buildTerminationEmbed(guildConfig: DeltaGuildConfig): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(guildConfig.embedColor)
    .setDescription(
      [
        "### <:DLplane:1531850073841864735> Termination Notice",
        "> -# Academy Termination ",
        "",
        "> <:whitedot:1492002923033657405>After several warnings and due to irreparable circumstances or other external reasons, you have been **terminated** from Delta Air Lines' academy. If you have any questions or concerns regarding this termination, please reach out to our assistance bot. Please note that this termination is **not appealable**. We wish you the best in your future endeavors.",
        "",
        "-# <:DLacademy06:1532393158242209983> Sent by Emiko Mizuki, Chief Talent Officer & Michael Blair, Chief People Officer"
      ].join("\n")
    )
    .setFooter({ text: `${guildConfig.name} • Termination Notice` });
}

function buildPanelCustomId(...parts: string[]): string {
  return [academyPanelPrefix, ...parts].join(":");
}

function parsePanelCustomId(customId: string): string[] | null {
  if (!customId.startsWith(`${academyPanelPrefix}:`)) {
    return null;
  }

  return customId.split(":");
}

function getPanelOwnerId(parts: string[]): string | null {
  const action = parts[1];

  if (
    action === "warn" ||
    action === "terminate" ||
    action === "warn-modal" ||
    action === "terminate-modal" ||
    action === "session-select" ||
    action === "start" ||
    action === "postpone" ||
    action === "cancel" ||
    action === "postpone-modal"
  ) {
    return parts[2] ?? null;
  }

  if (action === "nav") {
    return parts[3] ?? null;
  }

  return null;
}

function buildTrainingPanelComponents(
  ownerId: string,
  sessions: AcademySessionRow[],
  page: AcademyPanelPage,
  selectedSessionId?: string
): AcademyPanelPayload["components"] {
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildPanelCustomId("nav", academyPanelPageTrainees, ownerId))
      .setLabel("Trainees")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === academyPanelPageTrainees),
    new ButtonBuilder()
      .setCustomId(buildPanelCustomId("nav", academyPanelPageSessions, ownerId))
      .setLabel("Sessions")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === academyPanelPageSessions)
  );

  if (page === academyPanelPageTrainees) {
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buildPanelCustomId("warn", ownerId))
        .setLabel("Warn Trainee")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildPanelCustomId("terminate", ownerId))
        .setLabel("Terminate Trainee")
        .setStyle(ButtonStyle.Secondary)
    );

    return [navRow, actionRow];
  }

  const sessionOptions = sessions.slice(0, 25).map((session) => ({
    label: `${session.department} | ${session.location}`,
    description: `${session.timestamp_text} | Stage ${session.stage}`.slice(0, 100),
    value: session.id,
    default: session.id === selectedSessionId
  }));

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(buildPanelCustomId("session-select", ownerId))
      .setPlaceholder("Select a scheduled training session")
      .setMinValues(1)
      .setMaxValues(1)
      .setDisabled(sessionOptions.length === 0)
      .addOptions(
        sessionOptions.length > 0
          ? sessionOptions
          : [{ label: "No scheduled sessions", value: "none", description: "Nothing to manage." }]
      )
  );

  const selectedSessionExists = selectedSessionId
    ? sessions.some((session) => session.id === selectedSessionId)
    : false;

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildPanelCustomId("start", ownerId, selectedSessionId ?? "none"))
      .setLabel("Start Session")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selectedSessionExists),
    new ButtonBuilder()
      .setCustomId(buildPanelCustomId("postpone", ownerId, selectedSessionId ?? "none"))
      .setLabel("Postpone Session")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selectedSessionExists),
    new ButtonBuilder()
      .setCustomId(buildPanelCustomId("cancel", ownerId, selectedSessionId ?? "none"))
      .setLabel("Cancel Session")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!selectedSessionExists)
  );

  return [navRow, selectRow, actionRow];
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

async function deleteAcademySessionById(
  context: DeltaCoreContext,
  sessionId: string
): Promise<void> {
  const { error } = await context.supabase.from("academy_sessions").delete().eq("id", sessionId);

  if (error) {
    throw error;
  }
}

async function getCurrentHostDisplayName(
  guild: Guild,
  session: AcademySessionRow
): Promise<string> {
  const member = await guild.members.fetch(session.host_discord_user_id).catch(() => null);
  return member?.displayName ?? session.host_display_name;
}

async function getScheduledAcademySessions(
  context: DeltaCoreContext,
  guildId: string,
  departments?: AcademyDepartment[]
): Promise<AcademySessionRow[]> {
  let query = context.supabase
    .from("academy_sessions")
    .select("*")
    .eq("guild_id", guildId)
    .eq("status", "scheduled")
    .order("created_at", { ascending: true });

  if (departments && departments.length > 0) {
    query = query.in("department", departments);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademySessionRow[];
}

async function getAcademySessionById(
  context: DeltaCoreContext,
  sessionId: string
): Promise<AcademySessionRow | null> {
  const { data, error } = await context.supabase
    .from("academy_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AcademySessionRow | null) ?? null;
}

async function updateAcademySessionTimestamp(
  context: DeltaCoreContext,
  sessionId: string,
  timestampText: string
): Promise<void> {
  const { error } = await context.supabase
    .from("academy_sessions")
    .update({ timestamp_text: timestampText })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }
}

async function markAcademySessionStarted(
  context: DeltaCoreContext,
  sessionId: string,
  commencementMessageId: string
): Promise<void> {
  const { error } = await context.supabase
    .from("academy_sessions")
    .update({ status: "started", commencement_message_id: commencementMessageId })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }
}

async function fetchWarningPointsMap(
  context: DeltaCoreContext,
  guildId: string,
  traineeIds: string[]
): Promise<Map<string, number>> {
  if (traineeIds.length === 0) {
    return new Map();
  }

  const { data, error } = await context.supabase
    .from("academy_trainee_discipline")
    .select("trainee_discord_user_id, warning_points")
    .eq("guild_id", guildId)
    .in("trainee_discord_user_id", traineeIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((row) => [row.trainee_discord_user_id as string, row.warning_points as number])
  );
}

async function fetchAcademyDisciplineState(
  context: DeltaCoreContext,
  guildId: string,
  traineeId: string
): Promise<AcademyDisciplineStateRow | null> {
  const { data, error } = await context.supabase
    .from("academy_trainee_discipline")
    .select("*")
    .eq("guild_id", guildId)
    .eq("trainee_discord_user_id", traineeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AcademyDisciplineStateRow | null) ?? null;
}

async function upsertAcademyDisciplineState(
  context: DeltaCoreContext,
  payload: AcademyDisciplineStateUpsert
): Promise<void> {
  const { error } = await context.supabase.from("academy_trainee_discipline").upsert(payload, {
    onConflict: "guild_id,trainee_discord_user_id"
  });

  if (error) {
    throw error;
  }
}

async function insertAcademyDisciplineLog(
  context: DeltaCoreContext,
  payload: AcademyDisciplineLogInsert
): Promise<void> {
  const { error } = await context.supabase.from("academy_trainee_discipline_logs").insert(payload);

  if (error) {
    throw error;
  }
}

async function sendAcademyDisciplineLogMessage(
  guild: Guild,
  guildConfig: DeltaGuildConfig,
  action: "warning" | "termination",
  traineeDisplayName: string,
  moderatorDisplayName: string,
  warningPointsAfter: number
): Promise<{ threadId: string; messageId: string }> {
  const logThread = await guild.channels.fetch(academyDisciplineLogThreadId);

  if (!logThread?.isTextBased() || !("send" in logThread)) {
    throw new Error("The academy discipline log thread is unavailable.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const actionLabel = action === "warning" ? "Warning Issued" : "Termination Issued";
  const description = [
    "### <:DLplane:1531850073841864735> Academy Discipline Log",
    `> -# ${actionLabel}`,
    "-# _ _",
    `<:whitedot:1492002923033657405>**@**${traineeDisplayName} has received a ${action} action from **@**${moderatorDisplayName}.`,
    `-# — Warning Points: ${warningPointsAfter}`,
    `-# — Logged At: <t:${timestamp}:F>`
  ].join("\n");

  const message = await logThread.send({
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setDescription(description)
        .setFooter({ text: `${guildConfig.name} • Training Information` })
    ]
  });

  return { threadId: academyDisciplineLogThreadId, messageId: message.id };
}

async function fetchAcademyDepartmentTrainees(guild: Guild): Promise<AcademyDepartmentTrainees[]> {
  await guild.members.fetch().catch(() => null);

  return academyDepartmentChoices.map((department) => {
    const roleId = academyDepartmentRouting[department].roleId;
    const role = guild.roles.cache.get(roleId);
    const members = role ? Array.from(role.members.values()) : [];

    members.sort((left, right) => left.displayName.localeCompare(right.displayName));

    return { department, members };
  });
}

async function buildTrainingPanelPayload(
  guild: Guild,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext,
  ownerId: string,
  page: AcademyPanelPage,
  selectedSessionId?: string
): Promise<AcademyPanelPayload> {
  if (page === academyPanelPageTrainees) {
    const departments = await fetchAcademyDepartmentTrainees(guild);
    const traineeIds = Array.from(
      new Set(departments.flatMap((departmentGroup) => departmentGroup.members.map((member) => member.id)))
    );
    const warningPoints = await fetchWarningPointsMap(context, guild.id, traineeIds);

    return {
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setDescription(buildTrainingPanelTraineesDescription(departments, warningPoints))
          .setFooter({ text: `${guildConfig.name} • Training Information` })
      ],
      components: buildTrainingPanelComponents(ownerId, [], page)
    };
  }

  const sessions = await getScheduledAcademySessions(context, guild.id);
  const effectiveSelectedSessionId =
    selectedSessionId && sessions.some((session) => session.id === selectedSessionId)
      ? selectedSessionId
      : sessions[0]?.id;

  return {
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setDescription(buildTrainingPanelSessionsDescription(sessions, effectiveSelectedSessionId))
        .setFooter({ text: `${guildConfig.name} • Training Information` })
    ],
    components: buildTrainingPanelComponents(
      ownerId,
      sessions,
      page,
      effectiveSelectedSessionId
    )
  };
}

async function refreshPanelInteraction(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext,
  page: AcademyPanelPage,
  selectedSessionId?: string
): Promise<void> {
  if (!interaction.guild) {
    throw new Error("The training panel requires a guild context.");
  }

  const payload = await buildTrainingPanelPayload(
    interaction.guild,
    guildConfig,
    context,
    interaction.user.id,
    page,
    selectedSessionId
  );

  await interaction.update({
    embeds: payload.embeds,
    components: payload.components
  });
}

async function ensurePanelOwner(
  interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction,
  ownerId: string
): Promise<boolean> {
  if (interaction.user.id === ownerId) {
    return true;
  }

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({
      flags: MessageFlags.Ephemeral,
      content: "Only the instructor who opened this panel can use these controls."
    });
  } else {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Only the instructor who opened this panel can use these controls."
    });
  }

  return false;
}

async function cancelAcademySession(
  guild: Guild,
  context: DeltaCoreContext,
  session: AcademySessionRow
): Promise<void> {
  const channel = await guild.channels.fetch(session.announcement_channel_id).catch(() => null);

  if (channel?.isTextBased() && "messages" in channel) {
    const message = await channel.messages.fetch(session.announcement_message_id).catch(() => null);
    if (message) {
      await message.delete().catch(() => null);
    }
  }

  await deleteAcademySessionById(context, session.id);
}

async function startAcademySession(
  guild: Guild,
  context: DeltaCoreContext,
  session: AcademySessionRow
): Promise<void> {
  const channel = await guild.channels.fetch(session.announcement_channel_id).catch(() => null);

  if (!channel?.isTextBased() || !("send" in channel)) {
    throw new Error("The original announcement channel for this session is unavailable.");
  }

  const departmentRoute = academyDepartmentRouting[session.department];
  const finalCommencement = buildAcademySessionCommencement(session.location);
  const ghostPingMessage = `<@&${departmentRoute.roleId}>\n${finalCommencement}`;

  const message = await channel.send({
    content: ghostPingMessage,
    allowedMentions: { roles: [departmentRoute.roleId] }
  });

  await message.edit({
    content: finalCommencement,
    allowedMentions: { parse: [] }
  });

  await markAcademySessionStarted(context, session.id, message.id);
}

async function postponeAcademySession(
  guild: Guild,
  context: DeltaCoreContext,
  session: AcademySessionRow,
  newTimestampText: string
): Promise<void> {
  const channel = await guild.channels.fetch(session.announcement_channel_id).catch(() => null);

  if (!channel?.isTextBased() || !("messages" in channel)) {
    throw new Error("The original announcement channel for this session is unavailable.");
  }

  const message = await channel.messages.fetch(session.announcement_message_id).catch(() => null);

  if (!message) {
    throw new Error("The original session announcement could not be found.");
  }

  const hostDisplayName = await getCurrentHostDisplayName(guild, session);
  const updatedAnnouncement = buildAcademySessionAnnouncement(
    session.department,
    newTimestampText,
    session.stage,
    hostDisplayName
  );

  await message.edit({
    content: updatedAnnouncement,
    allowedMentions: { parse: [] }
  });

  await updateAcademySessionTimestamp(context, session.id, newTimestampText);
}

async function handleAcademySessions(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setDescription(buildAcademySessionsDescription([]))
          .setFooter({ text: `${guildConfig.name} • Training Information` })
      ]
    });
    return;
  }

  const sessions = await getScheduledAcademySessions(context, guildConfig.id, visibleDepartments);
  const sessionLines: string[] = [];

  for (const session of sessions) {
    const channel = await interaction.guild.channels
      .fetch(session.announcement_channel_id)
      .catch(() => null);

    if (!channel?.isTextBased() || !("messages" in channel)) {
      await deleteAcademySessionById(context, session.id);
      continue;
    }

    const message = await channel.messages.fetch(session.announcement_message_id).catch(() => null);

    if (!message) {
      await deleteAcademySessionById(context, session.id);
      continue;
    }

    const hostDisplayName = await getCurrentHostDisplayName(interaction.guild, session);

    sessionLines.push(
      `-# — **@**${hostDisplayName} | ${session.timestamp_text} | Stage ${session.stage}`
    );
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const instructorUser = interaction.options.getUser("user", true);
  const traineeUser = interaction.options.getUser("trainee", true);
  const departmentValue = interaction.options.getString("department", true);

  if (!isAcademyDepartment(departmentValue)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That department is not configured for instructor logs."
    });
    return;
  }

  const logThread = await interaction.guild.channels.fetch(academyGraduationLogThreadId);

  if (!logThread?.isTextBased() || !("send" in logThread)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
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

async function handleInstructorAttendance(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const instructorUser = interaction.options.getUser("instructor", true);
  const traineesValue = interaction.options.getString("trainees", true);
  const traineeIds = parseDiscordSnowflakes(traineesValue);

  if (traineeIds.length === 0) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Add at least one trainee mention or Discord ID in the trainees field."
    });
    return;
  }

  const instructorMember = await interaction.guild.members
    .fetch(instructorUser.id)
    .catch(() => null);
  const instructorDisplayName =
    instructorMember?.displayName ?? instructorUser.displayName ?? instructorUser.username;

  const traineeMembers = await Promise.all(
    traineeIds.map((traineeId) => interaction.guild.members.fetch(traineeId).catch(() => null))
  );

  const missingTrainees = traineeIds.filter((_, index) => traineeMembers[index] === null);

  if (missingTrainees.length > 0) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content:
        "I couldn't find every trainee in Delta Flight Academy. Double-check the mentions or IDs and try again."
    });
    return;
  }

  const traineeDisplayNames = traineeMembers.map((member) => member!.displayName);
  const attendanceThread = await interaction.guild.channels.fetch(academyAttendanceLogThreadId);

  if (!attendanceThread?.isTextBased() || !("send" in attendanceThread)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "The attendance log thread is unavailable right now."
    });
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const traineeLines = traineeDisplayNames.map((displayName) => `-# — **@**${displayName}`);
  const description = [
    "### <:DLplane:1531850073841864735> Training Attendance",
    "> -# Attendance Storage ",
    "-# _ _",
    `<:whitedot:1492002923033657405>The trainees below, trained by **@**${instructorDisplayName}, have gone through a **singular** training session, done at <t:${timestamp}:F>.`,
    "-# _ _",
    ...traineeLines
  ].join("\n");

  const message = await attendanceThread.send({
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setDescription(description)
        .setFooter({ text: `${guildConfig.name} • Training Information` })
    ]
  });

  const insertPayload: AcademyAttendanceLogInsert = {
    guild_id: guildConfig.id,
    instructor_discord_user_id: instructorUser.id,
    instructor_display_name: instructorDisplayName,
    trainee_discord_user_ids: traineeIds,
    trainee_display_names: traineeDisplayNames,
    log_thread_id: academyAttendanceLogThreadId,
    log_message_id: message.id,
    created_by_discord_user_id: interaction.user.id
  };

  const { error } = await context.supabase
    .from("academy_attendance_logs")
    .insert(insertPayload);

  if (error) {
    await message.delete().catch(() => null);
    throw error;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setTitle("Training Attendance Stored")
        .setDescription("The attendance log has been posted and saved.")
        .addFields(
          { name: "Instructor", value: instructorDisplayName, inline: true },
          { name: "Trainees", value: traineeDisplayNames.join(", "), inline: false },
          { name: "Logged At", value: `<t:${timestamp}:F>`, inline: false }
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
      flags: MessageFlags.Ephemeral,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const hostUser = interaction.options.getUser("host_instructor", true);
  const locationValue = interaction.options.getString("location", true);
  const departmentValue = interaction.options.getString("department", true);
  const timestamp = interaction.options.getString("timestamp", true);
  const stage = interaction.options.getString("stage", true);

  if (!isAcademyDepartment(departmentValue)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That department is not configured for session creation."
    });
    return;
  }

  if (!isAcademyLocation(locationValue)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That location is not configured for academy session creation."
    });
    return;
  }

  const departmentRoute = academyDepartmentRouting[departmentValue];
  const announcementChannel = await interaction.guild.channels.fetch(
    departmentRoute.announcementChannelId
  );

  if (!announcementChannel?.isTextBased() || !("send" in announcementChannel)) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "The announcement channel for that department is unavailable right now."
    });
    return;
  }

  const hostMember = await interaction.guild.members.fetch(hostUser.id).catch(() => null);
  const hostDisplayName =
    hostMember?.displayName ?? hostUser.displayName ?? hostUser.username;

  const finalAnnouncement = buildAcademySessionAnnouncement(
    departmentValue,
    timestamp,
    stage,
    hostDisplayName
  );
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
    location: locationValue,
    stage,
    timestamp_text: timestamp,
    host_discord_user_id: hostUser.id,
    host_display_name: hostDisplayName,
    announcement_channel_id: departmentRoute.announcementChannelId,
    announcement_message_id: message.id,
    status: "scheduled",
    created_by_discord_user_id: interaction.user.id
  });

  if (error) {
    await message.delete().catch(() => null);
    throw error;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor(guildConfig.embedColor)
        .setTitle("Training Session Created")
        .setDescription(
          "The training session has been announced and the department was ghost pinged."
        )
        .addFields(
          { name: "Department", value: departmentValue, inline: true },
          { name: "Location", value: locationValue, inline: true },
          { name: "Stage", value: stage, inline: true },
          { name: "Timestamp", value: timestamp, inline: false },
          { name: "Host", value: hostDisplayName, inline: true },
          { name: "Channel", value: `<#${departmentRoute.announcementChannelId}>`, inline: true }
        )
        .setFooter({ text: guildConfig.name })
    ]
  });
}

async function handleInstructorTrainingPanel(
  interaction: ChatInputCommandInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This command must be used from inside Delta Flight Academy."
    });
    return;
  }

  const payload = await buildTrainingPanelPayload(
    interaction.guild,
    guildConfig,
    context,
    interaction.user.id,
    academyPanelPageTrainees
  );

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: payload.embeds,
    components: payload.components
  });
}

async function issueAcademyWarning(
  interaction: ModalSubmitInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext,
  traineeId: string
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This action must be used inside Delta Flight Academy."
    });
    return;
  }

  const traineeMember = await interaction.guild.members.fetch(traineeId).catch(() => null);

  if (!traineeMember) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "I couldn't find that trainee in Delta Flight Academy."
    });
    return;
  }

  const currentState = await fetchAcademyDisciplineState(context, interaction.guild.id, traineeId);

  if (currentState?.terminated_at) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That trainee has already been terminated."
    });
    return;
  }

  const nextWarningPoints = (currentState?.warning_points ?? 0) + 1;
  const moderatorDisplayName = (interaction.member as GuildMember).displayName;

  await traineeMember.send({ embeds: [buildWarningEmbed(guildConfig)] }).catch(() => null);

  await upsertAcademyDisciplineState(context, {
    guild_id: interaction.guild.id,
    trainee_discord_user_id: traineeMember.id,
    trainee_display_name: traineeMember.displayName,
    warning_points: nextWarningPoints,
    terminated_at: null,
    last_updated_by_discord_user_id: interaction.user.id
  });

  const warningLogMessage = await sendAcademyDisciplineLogMessage(
    interaction.guild,
    guildConfig,
    "warning",
    traineeMember.displayName,
    moderatorDisplayName,
    nextWarningPoints
  );

  await insertAcademyDisciplineLog(context, {
    guild_id: interaction.guild.id,
    trainee_discord_user_id: traineeMember.id,
    trainee_display_name: traineeMember.displayName,
    moderator_discord_user_id: interaction.user.id,
    moderator_display_name: moderatorDisplayName,
    action: "warning",
    warning_points_after: nextWarningPoints,
    log_thread_id: warningLogMessage.threadId,
    log_message_id: warningLogMessage.messageId
  });

  if (nextWarningPoints >= 2) {
    await traineeMember.send({ embeds: [buildTerminationEmbed(guildConfig)] }).catch(() => null);
    await traineeMember
      .kick("Delta Flight Academy automatic termination after reaching two warnings.")
      .catch(() => null);

    await upsertAcademyDisciplineState(context, {
      guild_id: interaction.guild.id,
      trainee_discord_user_id: traineeMember.id,
      trainee_display_name: traineeMember.displayName,
      warning_points: nextWarningPoints,
      terminated_at: new Date().toISOString(),
      last_updated_by_discord_user_id: interaction.user.id
    });

    const terminationLogMessage = await sendAcademyDisciplineLogMessage(
      interaction.guild,
      guildConfig,
      "termination",
      traineeMember.displayName,
      moderatorDisplayName,
      nextWarningPoints
    );

    await insertAcademyDisciplineLog(context, {
      guild_id: interaction.guild.id,
      trainee_discord_user_id: traineeMember.id,
      trainee_display_name: traineeMember.displayName,
      moderator_discord_user_id: interaction.user.id,
      moderator_display_name: moderatorDisplayName,
      action: "termination",
      warning_points_after: nextWarningPoints,
      log_thread_id: terminationLogMessage.threadId,
      log_message_id: terminationLogMessage.messageId
    });

    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: `Warning issued to ${traineeMember.displayName}. They reached two warnings and were automatically terminated.`
    });
    return;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: `Warning issued to ${traineeMember.displayName}. They now have ${nextWarningPoints} warning point(s).`
  });
}

async function terminateAcademyTrainee(
  interaction: ModalSubmitInteraction,
  guildConfig: DeltaGuildConfig,
  context: DeltaCoreContext,
  traineeId: string
): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This action must be used inside Delta Flight Academy."
    });
    return;
  }

  const traineeMember = await interaction.guild.members.fetch(traineeId).catch(() => null);

  if (!traineeMember) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "I couldn't find that trainee in Delta Flight Academy."
    });
    return;
  }

  const currentState = await fetchAcademyDisciplineState(context, interaction.guild.id, traineeId);

  if (currentState?.terminated_at) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "That trainee has already been terminated."
    });
    return;
  }

  const moderatorDisplayName = (interaction.member as GuildMember).displayName;
  const warningPoints = currentState?.warning_points ?? 0;

  await traineeMember.send({ embeds: [buildTerminationEmbed(guildConfig)] }).catch(() => null);
  await traineeMember.kick("Delta Flight Academy manual termination from the training panel.");

  await upsertAcademyDisciplineState(context, {
    guild_id: interaction.guild.id,
    trainee_discord_user_id: traineeMember.id,
    trainee_display_name: traineeMember.displayName,
    warning_points: warningPoints,
    terminated_at: new Date().toISOString(),
    last_updated_by_discord_user_id: interaction.user.id
  });

  const terminationLogMessage = await sendAcademyDisciplineLogMessage(
    interaction.guild,
    guildConfig,
    "termination",
    traineeMember.displayName,
    moderatorDisplayName,
    warningPoints
  );

  await insertAcademyDisciplineLog(context, {
    guild_id: interaction.guild.id,
    trainee_discord_user_id: traineeMember.id,
    trainee_display_name: traineeMember.displayName,
    moderator_discord_user_id: interaction.user.id,
    moderator_display_name: moderatorDisplayName,
    action: "termination",
    warning_points_after: warningPoints,
    log_thread_id: terminationLogMessage.threadId,
    log_message_id: terminationLogMessage.messageId
  });

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: `${traineeMember.displayName} has been terminated and kicked from the academy.`
  });
}

export async function handleMessageComponentInteraction(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  context: DeltaCoreContext
): Promise<boolean> {
  const staffParts = parseStaffFlightCustomId(interaction.customId);

  if (staffParts) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "This flight action can only be used inside Delta Staff."
      });
      return true;
    }

    const action = staffParts[1];

    if (action === "create-type" && interaction.isStringSelectMenu()) {
      const ownerId = staffParts[2];
      const selectedType = interaction.values[0];

      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "Only the staff member creating this flight can continue the setup."
        });
        return true;
      }

      if (!isStaffFlightType(selectedType)) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "That flight type is not supported."
        });
        return true;
      }

      await showStaffFlightSetupOneModal(interaction, ownerId, selectedType);
      return true;
    }

    if (action === "create-continue" && interaction.isButton()) {
      const ownerId = staffParts[2];

      if (interaction.user.id !== ownerId) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "Only the staff member creating this flight can continue the setup."
        });
        return true;
      }

      await showStaffFlightSetupTwoModal(interaction, ownerId);
      return true;
    }

    if (action === "role-button" && interaction.isButton()) {
      const flightId = staffParts[2];
      const categoryKey = staffParts[3];

      if (!isStaffFlightCategoryKey(categoryKey)) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "That role category is not configured."
        });
        return true;
      }

      await showStaffFlightRoleSelector(interaction, context, flightId, categoryKey);
      return true;
    }

    if (action === "role-select" && interaction.isStringSelectMenu()) {
      const flightId = staffParts[2];
      const categoryKey = staffParts[3];
      const selectedRole = interaction.values[0];

      if (!isStaffFlightCategoryKey(categoryKey) || !isStaffFlightRoleKey(selectedRole)) {
        await interaction.update({
          content: "That flight role is not configured correctly.",
          components: []
        });
        return true;
      }

      await assignStaffFlightRole(interaction, context, flightId, categoryKey, selectedRole);
      return true;
    }

    return false;
  }

  const parts = parsePanelCustomId(interaction.customId);

  if (!parts) {
    return false;
  }

  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This panel can only be used inside Delta Flight Academy."
    });
    return true;
  }

  const guildConfig = DELTA_GUILD_MAP.get(interaction.guildId);

  if (!guildConfig) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This server is not configured for Delta Core yet."
    });
    return true;
  }

  const ownerId = getPanelOwnerId(parts);

  if (!ownerId) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This panel action is missing its owner context."
    });
    return true;
  }

  if (!(await ensurePanelOwner(interaction, ownerId))) {
    return true;
  }

  const action = parts[1];

  if (action === "nav" && interaction.isButton()) {
    const page = parts[2] as AcademyPanelPage;
    await refreshPanelInteraction(interaction, guildConfig, context, page);
    return true;
  }

  if (action === "warn" && interaction.isButton()) {
    const modal = new ModalBuilder()
      .setCustomId(buildPanelCustomId("warn-modal", ownerId))
      .setTitle("Warn Trainee");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("trainee")
          .setLabel("Trainee Mention or Discord ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  if (action === "terminate" && interaction.isButton()) {
    const modal = new ModalBuilder()
      .setCustomId(buildPanelCustomId("terminate-modal", ownerId))
      .setTitle("Terminate Trainee");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("trainee")
          .setLabel("Trainee Mention or Discord ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  if (action === "session-select" && interaction.isStringSelectMenu()) {
    const selectedSessionId = interaction.values[0];
    await refreshPanelInteraction(
      interaction,
      guildConfig,
      context,
      academyPanelPageSessions,
      selectedSessionId === "none" ? undefined : selectedSessionId
    );
    return true;
  }

  if (action === "start" && interaction.isButton()) {
    const sessionId = parts[3];

    if (!sessionId || sessionId === "none") {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Select a scheduled session first."
      });
      return true;
    }

    const session = await getAcademySessionById(context, sessionId);

    if (!session || !isSessionScheduled(session)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "That session is no longer available."
      });
      return true;
    }

    await startAcademySession(interaction.guild, context, session);
    await refreshPanelInteraction(interaction, guildConfig, context, academyPanelPageSessions);
    return true;
  }

  if (action === "postpone" && interaction.isButton()) {
    const sessionId = parts[3];

    if (!sessionId || sessionId === "none") {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Select a scheduled session first."
      });
      return true;
    }

    const session = await getAcademySessionById(context, sessionId);

    if (!session || !isSessionScheduled(session)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "That session is no longer available."
      });
      return true;
    }

    const modal = new ModalBuilder()
      .setCustomId(buildPanelCustomId("postpone-modal", ownerId, sessionId))
      .setTitle("Postpone Session");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("timestamp")
          .setLabel("Updated Timestamp")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(session.timestamp_text)
      )
    );

    await interaction.showModal(modal);
    return true;
  }

  if (action === "cancel" && interaction.isButton()) {
    const sessionId = parts[3];

    if (!sessionId || sessionId === "none") {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Select a scheduled session first."
      });
      return true;
    }

    const session = await getAcademySessionById(context, sessionId);

    if (!session || !isSessionScheduled(session)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "That session is no longer available."
      });
      return true;
    }

    await cancelAcademySession(interaction.guild, context, session);
    await refreshPanelInteraction(interaction, guildConfig, context, academyPanelPageSessions);
    return true;
  }

  return false;
}

export async function handleModalSubmitInteraction(
  interaction: ModalSubmitInteraction,
  context: DeltaCoreContext
): Promise<boolean> {
  const staffParts = parseStaffFlightCustomId(interaction.customId);

  if (staffParts) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "This flight action can only be used inside Delta Staff."
      });
      return true;
    }

    const guildConfig = DELTA_GUILD_MAP.get(interaction.guildId);

    if (!guildConfig) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "This server is not configured for Delta Core yet."
      });
      return true;
    }

    const action = staffParts[1];
    const ownerId = staffParts[2];

    if (interaction.user.id !== ownerId) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Only the staff member creating this flight can continue the setup."
      });
      return true;
    }

    if (action === "setup-one") {
      const draft = staffFlightDrafts.get(ownerId);

      if (!draft) {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: "Your flight setup draft was not found. Run `/ops flight create` again."
        });
        return true;
      }

      draft.flightNumber = interaction.fields.getTextInputValue("flight_number").trim();
      draft.departure = interaction.fields.getTextInputValue("departure").trim();
      draft.destination = interaction.fields.getTextInputValue("destination").trim();
      draft.aircraft = interaction.fields.getTextInputValue("aircraft").trim();
      draft.codeshares = interaction.fields.getTextInputValue("codeshares").trim();
      staffFlightDrafts.set(ownerId, draft);

      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [
          new EmbedBuilder()
            .setColor(guildConfig.embedColor)
            .setTitle("Flight Setup Saved")
            .setDescription("Part 1 is complete. Continue to enter gates and timestamps.")
            .addFields(
              { name: "Flight Number", value: draft.flightNumber, inline: true },
              { name: "Route", value: `${draft.departure} - ${draft.destination}`, inline: true },
              { name: "Aircraft", value: draft.aircraft, inline: true }
            )
            .setFooter({ text: guildConfig.name })
        ],
        components: [buildStaffFlightContinueButton(ownerId)]
      });
      return true;
    }

    if (action === "setup-two") {
      await finalizeStaffFlightCreation(interaction, guildConfig, context, ownerId);
      return true;
    }

    return false;
  }

  const parts = parsePanelCustomId(interaction.customId);

  if (!parts) {
    return false;
  }

  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This panel can only be used inside Delta Flight Academy."
    });
    return true;
  }

  const guildConfig = DELTA_GUILD_MAP.get(interaction.guildId);

  if (!guildConfig) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This server is not configured for Delta Core yet."
    });
    return true;
  }

  const ownerId = getPanelOwnerId(parts);

  if (!ownerId) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This panel action is missing its owner context."
    });
    return true;
  }

  if (!(await ensurePanelOwner(interaction, ownerId))) {
    return true;
  }

  const action = parts[1];

  if (action === "warn-modal") {
    const traineeInput = interaction.fields.getTextInputValue("trainee");
    const traineeId = parseSingleDiscordSnowflake(traineeInput);

    if (!traineeId) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Provide a valid trainee mention or Discord ID."
      });
      return true;
    }

    await issueAcademyWarning(interaction, guildConfig, context, traineeId);
    return true;
  }

  if (action === "terminate-modal") {
    const traineeInput = interaction.fields.getTextInputValue("trainee");
    const traineeId = parseSingleDiscordSnowflake(traineeInput);

    if (!traineeId) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "Provide a valid trainee mention or Discord ID."
      });
      return true;
    }

    await terminateAcademyTrainee(interaction, guildConfig, context, traineeId);
    return true;
  }

  if (action === "postpone-modal") {
    const sessionId = parts[3];
    const newTimestamp = interaction.fields.getTextInputValue("timestamp").trim();

    if (!sessionId || !newTimestamp) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "A valid session and timestamp are required."
      });
      return true;
    }

    const session = await getAcademySessionById(context, sessionId);

    if (!session || !isSessionScheduled(session)) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: "That session is no longer available."
      });
      return true;
    }

    await postponeAcademySession(interaction.guild, context, session, newTimestamp);
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: `The session has been postponed and updated to: ${newTimestamp}`
    });
    return true;
  }

  return false;
}

export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  context: DeltaCoreContext
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "This command can only be used inside a Discord server."
    });
    return;
  }

  const guildConfig = DELTA_GUILD_MAP.get(guildId);

  if (!guildConfig) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
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
    guildId === DELTA_GUILDS.staff.id &&
    route.commandName === "ops" &&
    route.subcommandGroupName === "flight" &&
    route.subcommandName === "create"
  ) {
    await handleStaffOpsFlightCreate(interaction, guildConfig);
    return;
  }

  if (
    guildId === DELTA_GUILDS.staff.id &&
    isStaffOpsRestrictedRoute(route) &&
    !memberHasExactRole(interaction, deltaStaffOpsRoleId)
  ) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setTitle("Access Denied")
          .setDescription("You do not have the required operations role to use this command.")
          .setFooter({ text: guildConfig.name })
      ]
    });
    return;
  }

  if (
    guildId === DELTA_GUILDS.staff.id &&
    isStaffHrRestrictedRoute(route) &&
    !memberHasExactRole(interaction, deltaStaffHrRoleId)
  ) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setTitle("Access Denied")
          .setDescription("You do not have the required HR role to use this command.")
          .setFooter({ text: guildConfig.name })
      ]
    });
    return;
  }

  if (
    isInstructorRestrictedRoute(route) &&
    guildConfig.minimumInstructorRoleId &&
    !(await memberMeetsMinimumRole(interaction, guildConfig.minimumInstructorRoleId))
  ) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      embeds: [
        new EmbedBuilder()
          .setColor(guildConfig.embedColor)
          .setTitle("Access Denied")
          .setDescription(
            "You do not have the minimum instructor rank required to use this command."
          )
          .setFooter({ text: guildConfig.name })
      ]
    });
    return;
  }

  if (route.commandName === "instructor" && route.subcommandName === "sessioncreate") {
    await handleInstructorSessionCreate(interaction, guildConfig, context);
    return;
  }

  if (route.commandName === "instructor" && route.subcommandName === "attendance") {
    await handleInstructorAttendance(interaction, guildConfig, context);
    return;
  }

  if (route.commandName === "instructor" && route.subcommandName === "log") {
    await handleInstructorLog(interaction, guildConfig, context);
    return;
  }

  if (route.commandName === "instructor" && route.subcommandName === "trainingpanel") {
    await handleInstructorTrainingPanel(interaction, guildConfig, context);
    return;
  }

  const commandPath = route.subcommandGroupName
    ? `/${route.commandName} ${route.subcommandGroupName} ${route.subcommandName ?? ""}`.trim()
    : route.subcommandName
      ? `/${route.commandName} ${route.subcommandName}`
      : `/${route.commandName}`;

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [createPlaceholderEmbed(guildConfig, commandPath)]
  });
}
