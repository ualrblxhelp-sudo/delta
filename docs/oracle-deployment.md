# Oracle Deployment Guide

This guide deploys Delta Core to an Oracle Cloud Always Free Linux VM.

## 1. Create the Oracle instance

Recommended choices:
- Home region only
- Always Free eligible shape
- Public IPv4 enabled
- Oracle Linux image

Oracle documents `VM.Standard.A1.Flex` as an Always Free shape with up to `2` total OCPUs and `12 GB` memory across the tenancy. A practical single-instance starting point is `1 OCPU / 6 GB RAM`.

## 2. SSH into the instance

```bash
ssh -i /path/to/private_key opc@YOUR_PUBLIC_IP
```

## 3. Install Node.js and Git

Oracle's current Oracle Linux package guidance shows:
- `sudo dnf install nodejs` for the default Oracle Linux 9 Node.js package
- `sudo dnf module enable nodejs:20` then `sudo dnf update nodejs` if you want Node 20 specifically

Commands:

```bash
sudo dnf update -y
sudo dnf install -y git nodejs
node -v
npm -v
```

Optional Node 20 upgrade on Oracle Linux 9:

```bash
sudo dnf module enable nodejs:20 -y
sudo dnf update -y nodejs
node -v
```

## 4. Clone the repository

```bash
git clone https://github.com/ualrblxhelp-sudo/delta.git /home/opc/delta-core
cd /home/opc/delta-core
```

## 5. Create the production environment file

Create `.env` in `/home/opc/delta-core` with:

```env
DISCORD_TOKEN=your_discord_bot_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_DB_URL=your_session_pooler_connection_string
ROBLOX_COOKIE=optional_roblox_cookie_if_needed
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_GUILD_ID=optional_test_guild_id
```

## 6. Install dependencies and build

```bash
npm install
npm run build
```

## 7. Install the systemd service

Copy the service template:

```bash
sudo cp deploy/delta-core.service /etc/systemd/system/delta-core.service
```

Reload and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable delta-core
sudo systemctl start delta-core
sudo systemctl status delta-core
```

## 8. View logs

```bash
journalctl -u delta-core -f
```

## Notes

- Delta Core is a Discord gateway bot, so it usually does not need inbound app ports opened unless you later add a dashboard or webhook endpoint.
- Use the Supabase `Session pooler` URI for `SUPABASE_DB_URL`.
- Keep the Supabase secret key and Discord token only on the server.
