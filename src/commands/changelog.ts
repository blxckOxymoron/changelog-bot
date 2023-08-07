import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import {
  ChannelType,
  Colors,
  PermissionsBitField,
  type ColorResolvable,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { getGuildAndChangelog } from "../lib/db/guild";
import { prisma } from "../lib/prisma";
import { objectKeys } from "@sapphire/utilities";
import { titleImages, updateChangelogEmbed } from "../lib/changelog/embed";

@ApplyOptions<Subcommand.Options>({
  description: "Manage the changelog",
  name: "changelog",
  subcommands: [
    {
      name: "edit",
      chatInputRun: "changelogEdit",
    },
    {
      name: "category",
      type: "group",
      entries: [
        {
          name: "add",
          chatInputRun: "categoryAdd",
        },
        {
          name: "remove",
          chatInputRun: "categoryRemove",
        },
        {
          name: "edit",
          chatInputRun: "categoryEdit",
        },
      ],
    },
    {
      name: "change_type",
      type: "group",
      entries: [
        {
          name: "add",
          chatInputRun: "changeTypeAdd",
        },
        {
          name: "remove",
          chatInputRun: "changeTypeRemove",
        },
        {
          name: "edit",
          chatInputRun: "changeTypeEdit",
        },
      ],
    },
    {
      name: "message",
      type: "group",
      entries: [
        {
          name: "add",
          chatInputRun: "messageAdd",
        },
        {
          name: "remove",
          chatInputRun: "messageRemove",
        },
        {
          name: "edit",
          chatInputRun: "messageEdit",
        },
      ],
    },
  ],
})
export class UserCommand extends Subcommand {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addSubcommand(cmd =>
          cmd
            .setName("edit")
            .setDescription("edit the changelog settings")
            .addChannelOption(opt =>
              opt
                .setRequired(false)
                .setName("channel")
                .setDescription("the channel to send changelogs in")
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            )
            .addStringOption(opt =>
              opt
                .setRequired(false)
                .setName("title")
                .setDescription("the title to use for changelogs")
            )
            .addStringOption(opt =>
              opt
                .setAutocomplete(true)
                .setRequired(false)
                .setName("color")
                .setDescription("the color to use for changelogs")
            )
            .addStringOption(opt =>
              opt
                .setAutocomplete(true)
                .setRequired(false)
                .setName("title_image")
                .setDescription("the image to use for the title of changelogs")
            )
            .addStringOption(opt =>
              opt
                .setRequired(false)
                .setName("end_of_week_message")
                .setDescription("the message to send at the end of the week")
            )
        )
        .addSubcommandGroup(group =>
          group
            .setName("category")
            .setDescription("manage categories")
            .addSubcommand(cmd =>
              cmd
                .setName("add")
                .setDescription("add a category")
                .addStringOption(opt =>
                  opt.setRequired(true).setName("name").setDescription("the name of the category")
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("remove")
                .setDescription("remove a category")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("category_id")
                    .setDescription("the id of the category (autocompletes)")
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("edit")
                .setDescription("edit a category")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("category_id")
                    .setDescription("the id of the category (autocompletes)")
                )
                .addStringOption(opt =>
                  opt
                    .setRequired(true)
                    .setName("new_name")
                    .setDescription("the new name of the category")
                )
            )
        )
        .addSubcommandGroup(group =>
          group
            .setName("change_type")
            .setDescription("manage change types")
            .addSubcommand(cmd =>
              cmd
                .setName("add")
                .setDescription("add a change type")
                .addStringOption(opt =>
                  opt
                    .setRequired(true)
                    .setName("change_type_name")
                    .setDescription("the name of the change type")
                )
                .addStringOption(opt =>
                  opt
                    .setRequired(true)
                    .setName("change_type_emoji")
                    .setDescription("the emoji of the change type")
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("remove")
                .setDescription("remove a change type")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("change_type_id")
                    .setDescription("the id of the change type (autocompletes)")
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("edit")
                .setDescription("edit a change type")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("change_type_id")
                    .setDescription("the id of the change type (autocompletes)")
                )
                .addStringOption(opt =>
                  opt
                    .setRequired(false)
                    .setName("new_change_type_name")
                    .setDescription("the new name of the change type")
                )
                .addStringOption(opt =>
                  opt
                    .setRequired(false)
                    .setName("new_change_type_emoji")
                    .setDescription("the new emoji of the change type")
                )
            )
        )
        .addSubcommandGroup(group =>
          group
            .setName("message")
            .setDescription("manage messages")
            .addSubcommand(cmd =>
              cmd
                .setName("add")
                .setDescription("add a message")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("category_id")
                    .setDescription("the category to add the message to (autocompletes)")
                )
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("change_type_id")
                    .setDescription("the change type of the message (autocompletes)")
                )
                .addStringOption(opt =>
                  opt.setRequired(true).setName("message").setDescription("the message to add")
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("remove")
                .setDescription("remove a message")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("message_id")
                    .setDescription("the id of the message (autocompletes)")
                )
            )
            .addSubcommand(cmd =>
              cmd
                .setName("edit")
                .setDescription("edit a message")
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(true)
                    .setName("message_id")
                    .setDescription("the id of the message (autocompletes)")
                )
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(false)
                    .setName("new_category_id")
                    .setDescription("the new category")
                )
                .addStringOption(opt =>
                  opt
                    .setAutocomplete(true)
                    .setRequired(false)
                    .setName("new_change_type_id")
                    .setDescription("the new change type")
                )
                .addStringOption(opt =>
                  opt.setRequired(false).setName("new_message").setDescription("the new message")
                )
            )
        )
    );
  }

  public async changelogEdit(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const channel = interaction.options.getChannel("channel", false);
    const title = interaction.options.getString("title", false);
    const color = interaction.options.getString("color", false);
    const titleImage = interaction.options.getString("title_image", false);
    const endOfWeekMessage = interaction.options.getString("end_of_week_message", false);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    if (!(channel || title || color || titleImage || endOfWeekMessage)) {
      await interaction.reply({
        content: "No new data provided!",
        ephemeral: true,
      });

      return;
    }

    if (
      color &&
      !(
        (objectKeys(Colors) as string[]).includes(color) ||
        color === "Random" ||
        /^#[0-9A-F]{6}$/i.test(color)
      )
    ) {
      await interaction.reply({
        content: "Invalid color!",
        ephemeral: true,
      });

      return;
    }

    if (
      titleImage &&
      !(
        /^((\w+:\/\/)[-a-zA-Z0-9:@;?&=\/%\+\.\*!'\(\),\$_\{\}\^~\[\]`#|]+)$/i.test(titleImage) ||
        titleImages.some(img => img.value === titleImage)
      )
    ) {
      await interaction.reply({
        content: "Invalid title image!",
        ephemeral: true,
      });

      return;
    }

    await prisma.changelog.update({
      where: {
        guildId: dbGuild.id,
      },
      data: {
        channelId: channel?.id ?? undefined,
        title: title ?? undefined,
        color: color ?? undefined,
        titleImage: titleImage ?? undefined,
        endOfWeekMessage: endOfWeekMessage ?? undefined,
      },
    });

    await interaction.reply({
      content: `Changelog settings updated!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async categoryAdd(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const categoryName = interaction.options.getString("name", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    await prisma.category.create({
      data: {
        name: categoryName,
        guildId: dbGuild.id,
      },
    });

    await interaction.reply({
      content: `Category __${categoryName}__ added!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async categoryRemove(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const categoryId = interaction.options.getString("category_id", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    const deleted = await prisma.category
      .delete({
        where: {
          id: categoryId,
          guildId: dbGuild.id,
        },
      })
      .catch(error => ({ error }));

    if ("error" in deleted) {
      await interaction.reply({
        content: `Category __${categoryId}__ not found! Use the categories suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    await interaction.reply({
      content: `Category __${deleted.name}__ removed!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async categoryEdit(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const categoryId = interaction.options.getString("category_id", true);
    const newCategoryName = interaction.options.getString("new_name", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    const category = await prisma.category
      .update({
        where: {
          id: categoryId,
          guildId: dbGuild.id,
        },
        data: {
          name: newCategoryName,
        },
      })
      .catch(error => ({ error }));

    if ("error" in category) {
      await interaction.reply({
        content: `Category __${categoryId}__ not found! Use the categories suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    await interaction.reply({
      content: `Category renamed to __${newCategoryName}__!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async changeTypeAdd(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const changeTypeName = interaction.options.getString("change_type_name", true);
    const changeTypeEmoji = interaction.options.getString("change_type_emoji", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    await prisma.changeType.create({
      data: {
        name: changeTypeName,
        emoji: changeTypeEmoji,
        guildId: dbGuild.id,
      },
    });

    await interaction.reply({
      content: `Change type __${changeTypeName}__ added!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async changeTypeRemove(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const changeTypeId = interaction.options.getString("change_type_id", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    const deleted = await prisma.changeType
      .delete({
        where: {
          id: changeTypeId,
          guildId: dbGuild.id,
        },
      })
      .catch(error => ({ error }));

    if ("error" in deleted) {
      await interaction.reply({
        content: `Change type __${changeTypeId}__ not found! Use the change types suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    await interaction.reply({
      content: `Change type __${deleted.name}__ removed!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async changeTypeEdit(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const changeTypeId = interaction.options.getString("change_type_id", true);
    const newChangeTypeName = interaction.options.getString("new_change_type_name", false);
    const newChangeTypeEmoji = interaction.options.getString("new_change_type_emoji", false);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    if (!(newChangeTypeEmoji || newChangeTypeName)) {
      await interaction.reply({
        content: "No new name or emoji provided!",
        ephemeral: true,
      });

      return;
    }

    const result = await prisma.changeType
      .update({
        where: {
          id: changeTypeId,
          guildId: dbGuild.id,
        },
        data: {
          name: newChangeTypeName ?? undefined,
          emoji: newChangeTypeEmoji ?? undefined,
        },
      })
      .catch(error => ({ error }));

    if ("error" in result) {
      await interaction.reply({
        content: `Change type __${changeTypeId}__ not found! Use the change types suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    await interaction.reply({
      content: `Updated to __${result.emoji} › ${result.name}__!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async messageAdd(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const categoryId = interaction.options.getString("category_id", true);
    const changeTypeId = interaction.options.getString("change_type_id", true);
    const message = interaction.options.getString("message", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    const category = await prisma.category
      .findUnique({
        where: {
          id: categoryId,
          guildId: dbGuild.id,
        },
      })
      .catch(error => ({ error }));

    if (!category || "error" in category) {
      await interaction.reply({
        content: `Category not found! Use the categories suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    const changeType = await prisma.changeType
      .findUnique({
        where: {
          id: changeTypeId,
          guildId: dbGuild.id,
        },
      })
      .catch(error => ({ error }));

    if (!changeType || "error" in changeType) {
      await interaction.reply({
        content: `Change type not found! Use the change types suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    await prisma.changeMessage.create({
      data: {
        message,
        categoryId: category.id,
        changeTypeId: changeType.id,
        authorId: interaction.user.id,
      },
    });

    await interaction.reply({
      content: `Message added!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async messageRemove(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const messageId = interaction.options.getString("message_id", true);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    const dbMessage = await prisma.changeMessage
      .findUnique({
        where: {
          id: messageId,
          category: {
            guildId: dbGuild.id,
          },
          changeType: {
            // kinda double check, but it's fine
            guildId: dbGuild.id,
          },
        },
      })
      .catch(error => ({ error }));

    if (!dbMessage || "error" in dbMessage) {
      await interaction.reply({
        content: `Message not found! Use the messages suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    if (dbMessage.authorId !== interaction.user.id) {
      const confirmMessage = await interaction.reply({
        content: `This message was not created by you, but by <@${dbMessage.authorId}>! Are you sure you want to remove it?`,
        ephemeral: true,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("cancel")
              .setLabel("Cancel")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("confirm")
              .setLabel("Remove")
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });

      const confirmed = await confirmMessage
        .awaitMessageComponent({
          componentType: ComponentType.Button,
          time: 10e3,
          filter: componentInteraction => {
            componentInteraction.deferUpdate();
            return componentInteraction.customId === "confirm"; // no need to check for user, since it's ephemeral
          },
        })
        .then(() => true)
        .catch(() => false);

      await confirmMessage.delete();

      if (!confirmed) {
        await interaction.followUp({
          content: `Message not removed!`,
          ephemeral: true,
        });

        return;
      }
    } else {
      await interaction.deferReply({ ephemeral: true });
    }

    const deleted = await prisma.changeMessage
      .delete({
        // could error since time has passed
        where: {
          id: dbMessage.id,
        },
      })
      .catch(error => ({ error }));

    if ("error" in deleted) {
      await interaction.followUp({
        content: `Message not found!`,
        ephemeral: true,
      });

      return;
    }

    await interaction.followUp({
      content: `Message __${deleted.message}__ removed!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public async messageEdit(interaction: Subcommand.ChatInputCommandInteraction) {
    if (!interaction.inGuild()) return;

    const messageId = interaction.options.getString("message_id", true);
    const newCategoryId = interaction.options.getString("new_category_id", false);
    const newChangeTypeId = interaction.options.getString("new_change_type_id", false);
    const newMessage = interaction.options.getString("new_message", false);

    const dbGuild = await getGuildAndChangelog(interaction.guildId);

    const dbMessage = await prisma.changeMessage
      .findUnique({
        where: {
          id: messageId,
          category: {
            guildId: dbGuild.id,
          },
          changeType: {
            // kinda double check, but it's fine
            guildId: dbGuild.id,
          },
        },
      })
      .catch(error => ({ error }));

    if (!dbMessage || "error" in dbMessage) {
      await interaction.reply({
        content: `Message not found! Use the messages suggested by autocomplete.`,
        ephemeral: true,
      });

      return;
    }

    if (!(newCategoryId || newChangeTypeId || newMessage)) {
      await interaction.reply({
        content: `No changes specified!`,
        ephemeral: true,
      });

      return;
    }

    if (dbMessage.authorId !== interaction.user.id) {
      const confirmMessage = await interaction.reply({
        content: `This message was not created by you, but by <@${dbMessage.authorId}>! Are you sure you want to edit it?`,
        ephemeral: true,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("cancel")
              .setLabel("Cancel")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("confirm").setLabel("Edit").setStyle(ButtonStyle.Danger)
          ),
        ],
      });

      const confirmed = await confirmMessage
        .awaitMessageComponent({
          componentType: ComponentType.Button,
          time: 10e3,
          filter: componentInteraction => {
            componentInteraction.deferUpdate();
            return componentInteraction.customId === "confirm"; // no need to check for user, since it's ephemeral
          },
        })
        .then(() => true)
        .catch(() => false);

      await confirmMessage.delete();

      if (!confirmed) {
        await interaction.followUp({
          content: `Message not edited!`,
          ephemeral: true,
        });

        return;
      }
    } else {
      await interaction.deferReply({ ephemeral: true });
    }

    const updated = await prisma.changeMessage
      .update({
        // could error since time has passed
        where: {
          id: dbMessage.id,
        },
        data: {
          categoryId: newCategoryId ?? undefined,
          changeTypeId: newChangeTypeId ?? undefined,
          message: newMessage ?? undefined,
          authorId: interaction.user.id,
        },
        include: {
          category: true,
          changeType: true,
        },
      })
      .catch(error => ({ error }));

    if ("error" in updated) {
      await interaction.followUp({
        content: `Message not found!`,
        ephemeral: true,
      });

      return;
    }

    await interaction.followUp({
      content: `Updated to __${updated.category.name}: ${updated.changeType.emoji} | ${updated.changeType.name} > ${updated.message}__!`,
      ephemeral: true,
    });

    await updateChangelogEmbed(dbGuild.id, { interaction });
  }

  public override async autocompleteRun(interaction: Subcommand.AutocompleteInteraction) {
    if (!interaction.inGuild()) return;

    const focused = interaction.options.getFocused(true);

    switch (focused.name) {
      case "category_id":
      case "new_category_id": {
        const categories = await prisma.category.findMany({
          where: {
            guildId: interaction.guildId,
          },
        });

        await interaction.respond(
          categories
            .filter(category => category.name.toLowerCase().includes(focused.value.toLowerCase()))
            .slice(0, 25)
            .map(category => ({
              name: category.name,
              value: category.id,
            }))
        );

        break;
      }
      case "change_type_id":
      case "new_change_type_id": {
        const changeTypes = await prisma.changeType.findMany({
          where: {
            guildId: interaction.guildId,
          },
        });

        await interaction.respond(
          changeTypes
            .filter(changeType =>
              changeType.name.toLowerCase().includes(focused.value.toLowerCase())
            )
            .slice(0, 25)
            .map(changeType => ({
              name: `${changeType.emoji} | ${changeType.name}`,
              value: changeType.id,
            }))
        );

        break;
      }
      case "color":
      case "new_color": {
        if (focused.value.startsWith("#")) {
          let formattedColor = focused.value.toLowerCase().replace(/[^0-f]/g, "");
          formattedColor += "000000";
          formattedColor = formattedColor.slice(0, 7);

          await interaction.respond([
            {
              name: formattedColor,
              value: formattedColor,
            },
          ]);
        } else {
          const colors: Extract<ColorResolvable, string>[] = objectKeys(Colors);
          colors.push("Random");

          await interaction.respond(
            colors
              .filter(key => key.toLowerCase().includes(focused.value.toLowerCase()))
              .slice(0, 25)
              .map(key => ({
                name: key,
                value: key,
              }))
          );
        }
        break;
      }
      case "message_id":
      case "new_message_id": {
        const messages = await prisma.changeMessage.findMany({
          where: {
            category: {
              guildId: interaction.guildId,
            },
            changeType: {
              guildId: interaction.guildId,
            },
          },
          include: {
            changeType: true,
            category: true,
          },
        });

        await interaction.respond(
          messages
            .filter(message => message.message.toLowerCase().includes(focused.value.toLowerCase()))
            .slice(0, 25)
            .map(message => ({
              name: message.message.slice(0, 100),
              value: message.id,
              description: `${message.category.name}: ${message.changeType.emoji} | ${message.changeType.name}}`,
            }))
        );

        break;
      }
      case "title_image": {
        await interaction.respond(
          titleImages
            .filter(image => image.name.toLowerCase().includes(focused.value.toLowerCase()))
            .map(image => ({
              name: image.name,
              value: image.value,
            }))
        );
        break;
      }
      default: {
        this.container.logger.warn(
          `Unknown autocomplete name in changelog command: ${focused.name}`
        );

        await interaction.respond([]);
      }
    }
  }
}
