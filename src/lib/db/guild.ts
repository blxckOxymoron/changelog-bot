import { prisma } from "../prisma";

export async function getGuildAndChangelog(guildId: string) {
  const guild = await prisma.guild.upsert({
    where: {
      id: guildId,
    },
    update: {},
    create: {
      id: guildId,
      changelog: {
        create: {},
      },
      categories: {
        create: [
          {
            name: "📱 › App changes",
          },
          {
            name: "💬 › Discord changes",
          },
        ],
      },
      changeTypes: {
        create: [
          {
            name: "added",
            emoji: "🟩",
          },
          {
            name: "updates",
            emoji: "🟨",
          },
          {
            name: "removed",
            emoji: "🟥",
          },
        ],
      },
    },
    include: {
      changelog: true,
    },
  });

  if (guild.changelog === null) {
    guild.changelog = await prisma.changelog.upsert({
      where: {
        guildId: guild.id,
      },
      update: {},
      create: {
        guildId: guild.id,
      },
    });
  }

  return {
    ...guild,
    changelog: guild.changelog, // so changelog is not null
  };
}
