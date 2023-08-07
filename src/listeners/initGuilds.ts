import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { getGuildAndChangelog } from "../lib/db/guild";

@ApplyOptions<Listener.Options>({
  event: Events.ClientReady,
})
export class UserEvent extends Listener<typeof Events.ClientReady> {
  public override async run() {
    this.container.logger.info("Loading guilds...");

    const guilds = await this.container.client.guilds.fetch();
    for (const guildId of guilds.keys()) {
      getGuildAndChangelog(guildId);
    }
  }
}
