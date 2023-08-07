import { SapphireClient, container } from "@sapphire/framework";
import { GatewayIntentBits, OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { config } from "./lib/config";

import "@sapphire/plugin-logger/register";
import "@sapphire/plugin-subcommands/register";
import { startRespondToChangelogJob, startSendNewChangelogMessageJob } from "./lib/changelog/cron";

const client = new SapphireClient({
  intents: [GatewayIntentBits.GuildMessages],
  loadDefaultErrorListeners: true,
});

export function generateInvite() {
  return client.generateInvite({
    permissions: [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.UseExternalEmojis,
    ],
    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
  });
}

async function main() {
  await client.login(config.CLIENT_TOKEN);

  container.logger.info("Logged in!", "Invite:", generateInvite());

  startRespondToChangelogJob();
  startSendNewChangelogMessageJob();
}

main();
