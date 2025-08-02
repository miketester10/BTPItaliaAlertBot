import { API } from "../../consts/api";
import { JWT } from "../../consts/jwt";
import { BorsaItalianaApiResponse, isBorsaItalianaValidResponse } from "../../interfaces/borsa-italiana-response.interface";
import { MyMessageContext } from "../../interfaces/custom-context.interface";
import { logger } from "../../logger/logger";
import { ApiHandler } from "../api/api-handler";
import { DatabaseHandler } from "../database/database-handler";
import { errorHandler } from "../error/error-handler";

const dataBaseHandler: DatabaseHandler = DatabaseHandler.getInstance();
const apiHandler: ApiHandler = ApiHandler.getInstance();

export const handleStartCommand = async (ctx: MyMessageContext): Promise<void> => {
  try {
    await ctx.sendChatAction("typing");
    const telegramId = ctx.from?.id!;
    const name = ctx.from?.firstName!;
    const username = ctx.from?.username ?? null;
    logger.info(`Bot avviato da: ${name} - Telegram ID: ${telegramId}`);

    const user = await dataBaseHandler.findUserByTelegramId(telegramId);
    if (user) {
      const isUpdated = await dataBaseHandler.updateUser(telegramId, user, { name, username });
      logger.warn(`Utente già registrato. ${isUpdated ? `Dati aggiornati con succeso.` : `Nessun dato da aggiornare è stato trovato.`}`);
      return;
    }
    await dataBaseHandler.createUser({ telegramId, name, username });
    logger.info(`Nuovo utente registrato con successo.`);
    await ctx.reply(`👋 Benvenuto ${name}`);
  } catch (error) {
    errorHandler(error);
  }
};

export const handlePriceCommand = async (ctx: MyMessageContext): Promise<void> => {
  try {
    await ctx.sendChatAction("typing");
    const isin = ctx.update?.message?.text?.trim().split(/\s+/)[1];
    if (!isin) {
      await ctx.reply("⚠️ Inserisci un ISIN valido.");
      return;
    }
    const response = await apiHandler.getPrice<BorsaItalianaApiResponse>(`${API.BORSA_ITALIANA}${isin}${API.BORSA_ITALIANA_TAIL}`, {
      Authorization: `Bearer ${JWT.BORSA_ITALIANA}`,
    });
    if (isBorsaItalianaValidResponse(response)) {
      const price = response.intradayPoint.at(-1)?.endPx;
      const name = response.label;
      // chiamare metodo per formattare il messaggio da inviare sottoforma di FormattedString di Gramio (esempio: const message = createFormattedMessageForPrice(rawMessage))
      logger.info(`Ultimo prezzo: ${price}€`);
      await ctx.reply(`💰 ${isin} - ${name}\nPrice: ${price}€`);
    } else {
      // chiamare metodo per formattare il messaggio da inviare sottoforma di FormattedString di Gramio (esempio: const message = createFormattedMessageForPrice(rawMessage))
      logger.warn(`ISIN ${isin} non valido o non trovato.`);
      await ctx.reply("⚠️ ISIN non valido o non trovato.");
    }
  } catch (error) {
    errorHandler(error);
  }
};
