import { Bot } from "gramio";
import { DatabaseHandler } from "../handlers/database/database-handler";
import { logger } from "../logger/logger";

const prisma = DatabaseHandler.getInstance().prisma;

export const testCommand = (bot: Bot): void => {
  bot.command("test", async (ctx) => {
    const userId = ctx.from?.id!;
    const firstName = ctx.from?.firstName!;
    const userName = ctx.from?.username;
    // const newUser = await prisma.user.create({
    //   data: {
    //     telegramId: userId,
    //     name: firstName,
    //     username: userName,
    //     alerts: { create: { targetPrice: 100, isin: "IT0005631608" } },
    //   },
    //   include: {
    //     alerts: true,
    //   },
    // });
    // logger.info(`Nuovo utente registrato: ${newUser.name} (${newUser.telegramId})`);

    const user = await prisma.user.findUnique({ where: { telegramId: userId }, include: { alerts: true } });
    const alerts = await prisma.alert.findMany({ where: { userTelegramId: userId }, select: { targetPrice: true, isin: true } });
    if (!user) {
      logger.warn(`Utente con ID ${userId} non trovato.`);
    } else {
      logger.info(`Utente trovato: ${user.name} (${user.telegramId})`);
    }

    if (alerts.length > 0) {
      alerts.map((alert) => {
        logger.info(`Alert per l'utente ${userId}: ${alert.isin} - Prezzo target: ${alert.targetPrice}`);
      });
    } else {
      logger.info(`Nessun alert trovato per l'utente ${userId}.`);
    }
    await ctx.reply("Test command executed successfully!");
  });
};
