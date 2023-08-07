import type { Command } from "@sapphire/framework";

export async function respondWithInternalError(
  interaction: Command.ChatInputCommandInteraction,
  message: string,
  error: any
) {
  if (interaction.replied) {
    await interaction.followUp({ content: message, ephemeral: true });
  } else {
    await interaction.reply({
      content: "Unexpected Error: " + message,
      ephemeral: true,
    });
  }

  interaction.client.logger.error(message, "\n", error, "\n", interaction);
}
