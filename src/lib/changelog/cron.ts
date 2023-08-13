import { container } from "@sapphire/framework";
import { CronJob } from "cron";
import { prisma } from "../prisma";
import { generateChangelogEmbeds, updateChangelogEmbed } from "./embed";

let startSendNewChangelogMessageStarted = false;
export function startSendNewChangelogMessageJob() {
  if (startSendNewChangelogMessageStarted)
    return container.logger.warn("Send new changelog message job already started.");

  const schedule = "0 0 * * 1"; // At 00:00 on Monday.

  new CronJob(schedule, sendNewChangelogMessage, null, true, "Europe/Berlin");
  startSendNewChangelogMessageStarted = true;
}

export async function sendNewChangelogMessage() {
  container.logger.info("Send new changelog message job started.");

  const changelogs = await prisma.changelog.findMany({
    where: {
      NOT: {
        channelId: null,
      },
    },
  });

  for (const changelog of changelogs) {
    // store old changelog
    const embeds = await generateChangelogEmbeds(changelog);

    await prisma.archivedChangelog.create({
      data: {
        guildId: changelog.guildId,
        embed: JSON.stringify(embeds.map(embed => embed.toJSON())),
      },
    });

    // clear messages
    await prisma.changeMessage.deleteMany({
      where: {
        guildId: changelog.guildId,
      },
    });

    await updateChangelogEmbed(changelog.guildId, { sendNewMessage: true });
  }
}

let respondToChangelogStarted = false;
export function startRespondToChangelogJob() {
  if (respondToChangelogStarted)
    return container.logger.warn("Respond to changelog job already started.");

  const schedule = "0 18 * * 0"; // At 18:00 on Sunday.

  new CronJob(schedule, respondToChangelog, null, true, "Europe/Berlin");
  respondToChangelogStarted = true;
}

export async function respondToChangelog() {
  container.logger.info("Respond to changelog job started.");

  const changelogs = await prisma.changelog.findMany({
    where: {
      NOT: {
        lastMessageId: null,
        channelId: null,
      },
    },
  });

  for (const changelog of changelogs) {
    // store old changelog
    const channel =
      changelog.channelId && (await container.client.channels.fetch(changelog.channelId));

    if (!channel) {
      await prisma.changelog.update({
        where: {
          guildId: changelog.guildId,
        },
        data: {
          channelId: null,
          lastMessageId: null,
        },
      });

      continue;
    }

    if (!channel.isTextBased()) continue;

    const message =
      changelog.lastMessageId && (await channel.messages.fetch(changelog.lastMessageId));

    if (!message) {
      await prisma.changelog.update({
        where: {
          guildId: changelog.guildId,
        },
        data: {
          lastMessageId: null,
        },
      });

      continue;
    }

    await message.reply({
      content: changelog.endOfWeekMessage,
    });
  }
}
