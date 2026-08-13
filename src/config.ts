import "dotenv/config";

type Config = {
  discordToken: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
  discordClientId: string;
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
    discordClientId: requireEnv("DISCORD_CLIENT_ID"),
    robloxCookie: process.env.ROBLOX_COOKIE
  };
}
