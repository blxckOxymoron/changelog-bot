import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  chatInputApplicationCommandMention,
  type ColorResolvable,
  time,
  TimestampStyles,
  AttachmentBuilder,
} from "discord.js";
import { getGuildAndChangelog } from "../db/guild";
import type { Changelog } from "@prisma/client";
import { prisma } from "../prisma";
import { container } from "@sapphire/framework";
import { readdirSync } from "fs";

function getWeekDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(today.setDate(diff));
  const sunday = new Date(today.setDate(diff + 6));

  return [monday, sunday];
}

export const titleImages = readdirSync("./media/changelog-title")
  .map(file => file.replace(".png", ""))
  .map(titleName => ({
    name: titleName,
    value: `@local/${titleName}`,
    path: `./media/changelog-title/${titleName}.png`,
  }));

export async function generateChangelogEmbeds(changelog: Changelog): Promise<EmbedBuilder[]> {
  const changeTypes = await prisma.changeType.findMany({
    where: {
      guildId: changelog.guildId,
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      guildId: changelog.guildId,
    },
    include: {
      messages: {
        include: {
          changeType: {
            select: {
              emoji: true,
            },
          },
        },
      },
    },
  });

  const titleImageEmbed = new EmbedBuilder().setColor(changelog.color as ColorResolvable);

  if (changelog.titleImage.startsWith("@local/")) {
    const localPath = titleImages.find(
      titleImage => titleImage.value === changelog.titleImage
    )?.path;
    if (localPath === undefined) titleImageEmbed.setTitle("Title image not found");
    else {
      // const attachment = new AttachmentBuilder(localPath);
      titleImageEmbed.setImage(`attachment://${attachment.name}.png`);
    }
  } else {
    titleImageEmbed.setImage(changelog.titleImage);
  }

  const changelogCommandId = container.client.application?.commands.cache.find(
    command => command.name === "changelog"
  )?.id;

  if (changelogCommandId === undefined) throw new Error("Changelog command not found");

  const changelogEmbed = new EmbedBuilder()
    .setTitle(
      getWeekDates()
        .map(date => time(date, TimestampStyles.ShortDate))
        .join(" - ")
    )
    .setColor(changelog.color as ColorResolvable)
    .setDescription(
      changeTypes.length
        ? `_${changeTypes
            .map(changeType => `${changeType.emoji} › ${changeType.name}`)
            .join(", ")}_`
        : "No change types found. Please add some with " +
            chatInputApplicationCommandMention(
              "changelog",
              "change_type",
              "add",
              changelogCommandId
            )
    )
    .addFields(
      categories.length
        ? categories.map(category => ({
            name: "_ _\n> " + category.name,
            value: category.messages.length
              ? category.messages
                  .map(message => `${message.changeType.emoji} › ${message.message}`)
                  .join("\n")
              : "_No new changes_",
          }))
        : [
            {
              name: "No categories found",
              value:
                "Please add some categories with " +
                chatInputApplicationCommandMention(
                  "changelog",
                  "category",
                  "add",
                  changelogCommandId
                ),
            },
          ]
    )
    .setTimestamp();

  return [titleImageEmbed, changelogEmbed];
}

export async function updateChangelogEmbed(
  guildId: string,
  {
    sendNewMessage,
    interaction,
  }: { sendNewMessage?: boolean; interaction?: ChatInputCommandInteraction }
): Promise<Message | undefined> {
  const dbGuild = await getGuildAndChangelog(guildId);

  const channnel =
    dbGuild.changelog.channelId &&
    (await container.client.channels.fetch(dbGuild.changelog.channelId).catch(() => null));

  if (!channnel) {
    // no channel found

    if (dbGuild.changelog.channelId) {
      // channel id is set but channel not found
      await prisma.changelog.update({
        where: {
          guildId: dbGuild.id,
        },
        data: {
          channelId: null,
          lastMessageId: null,
        },
      });
    }

    if (interaction) {
      const changelogCommandId = container.client.application?.commands.cache.find(
        command => command.name === "changelog"
      )?.id;

      if (changelogCommandId === undefined) throw new Error("Changelog command not found");

      await interaction.followUp({
        content:
          "No channel set for changelog! Please set one with " +
          chatInputApplicationCommandMention("changelog", "edit", changelogCommandId),
        ephemeral: true,
      });
    }

    return;
  }

  if (!channnel.isTextBased()) return;

  const embeds = await generateChangelogEmbeds(dbGuild.changelog);

  const lastMessage =
    !sendNewMessage &&
    dbGuild.changelog.lastMessageId &&
    (await channnel.messages.fetch(dbGuild.changelog.lastMessageId).catch(() => null));

  if (lastMessage) {
    const newMessage = await lastMessage.edit({
      content: "# " + dbGuild.changelog.title,
      embeds,
    });

    return newMessage;
  } else {
    const newMessage = await channnel.send({
      content: "# " + dbGuild.changelog.title,
      embeds,
    });

    await prisma.changelog.update({
      where: {
        guildId: dbGuild.id,
      },
      data: {
        lastMessageId: newMessage.id,
      },
    });

    return newMessage;
  }
}
