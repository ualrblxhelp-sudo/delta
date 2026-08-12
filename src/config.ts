import "dotenv/config";

type Config = {
  discordToken: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
  discordClientId?: string;
  discordGuildId?: string;
  robloxCookie?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadConfig(): Config {
  return {
    discordToken: requireEnv("DISCORD_TOKEN"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseSecretKey: requireEnv("SUPABASE_SECRET_KEY"),
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordGuildId: process.env.DISCORD_GUILD_ID,
    robloxCookie: process.env.ROBLOX_COOKIE
  };
}
