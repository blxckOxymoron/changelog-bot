import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Guild } from "discord.js";
import { getGuildAndChangelog } from "../lib/db/guild";

@ApplyOptions<Listener.Options>({
  event: Events.GuildCreate,
})
export class UserEvent extends Listener<typeof Events.GuildCreate> {
  public override async run(guild: Guild) {
    this.container.logger.info(`Joined guild ${guild.name} (${guild.id})`);

    await getGuildAndChangelog(guild.id);
  }
}
