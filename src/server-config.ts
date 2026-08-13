export type DeltaGuildConfig = {
  id: string;
  name: string;
  embedColor: number;
  minimumInstructorRoleId?: string;
};

function parseColor(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export const DELTA_GUILDS = {
  airLines: {
    id: "965350803567177809",
    name: "Delta Air Lines",
    embedColor: parseColor("#051429")
  },
  flightAcademy: {
    id: "965441939761692752",
    name: "Delta Flight Academy",
    embedColor: parseColor("#111111"),
    minimumInstructorRoleId: "1118739008755880008"
  },
  staff: {
    id: "968651550857756763",
    name: "Delta Staff",
    embedColor: parseColor("#8C002B")
  },
  communications: {
    id: "1236424229755293766",
    name: "Delta Communications",
    embedColor: parseColor("#0068B7")
  },
  premium: {
    id: "1537552122537705572",
    name: "Delta Premium",
    embedColor: parseColor("#522570")
  }
} satisfies Record<string, DeltaGuildConfig>;

export const DELTA_GUILD_LIST = Object.values(DELTA_GUILDS);

export const DELTA_GUILD_MAP = new Map<string, DeltaGuildConfig>(
  DELTA_GUILD_LIST.map((guild) => [guild.id, guild])
);
