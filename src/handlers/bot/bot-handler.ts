import { Bot } from "gramio";
import { logger } from "../../logger/logger";
import { MyMessageContext } from "../../interfaces/custom-context.interface";
import { testCommand } from "../../test/test";

import { handlePriceCommand } from "./commands-helper";

export class BotHandler {
  private readonly BOT_TOKEN: string = process.env.BOT_TOKEN!;

  private static _instance: BotHandler;
  private readonly bot: Bot;

  private constructor() {
    this.bot = new Bot(this.BOT_TOKEN).onStart(async (ctx) => {
      if (!(await this.inizializeMenu())) {
        logger.warn("⚠️ Bot Telegram avviato senza Menu inizializzato");
      } else {
        logger.info("✅ Bot Telegram avviato con successo");
      }
      this.inizializeCommands();
      testCommand(this.bot);
    });
  }

  static getInstance(): BotHandler {
    if (!BotHandler._instance) {
      BotHandler._instance = new BotHandler();
    }
    return BotHandler._instance;
  }

  async start(): Promise<void> {
    await this.bot.start();
  }
  async inizializeMenu(): Promise<boolean> {
    // farlo nell helper dei comandi
    try {
      const commands_set = await this.bot.api.setMyCommands({
        commands: [
          {
            command: "price",
            description: "<ISIN> - Mostra il prezzo attuale del BTP",
          },
        ],
      });
      return commands_set;
    } catch (error) {
      const unknownError = error as Error;
      logger.error(`Errore durante il settaggio dei comandi: ${unknownError.message}`);
      return false;
    }
  }

  async inizializeCommands(): Promise<void> {
    this.bot.command("price", async (ctx: MyMessageContext) => {
      await handlePriceCommand(ctx);
    });
  }
}
