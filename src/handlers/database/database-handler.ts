import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "../../logger/logger";

export class DatabaseHandler {
  private static _instance: DatabaseHandler;
  readonly prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient(); // new PrismaClient({ log: ["query", "warn", "error"] });  se voglio vedere i log delle query
  }

  static getInstance(): DatabaseHandler {
    if (!DatabaseHandler._instance) {
      DatabaseHandler._instance = new DatabaseHandler();
    }
    return DatabaseHandler._instance;
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info("✅ Database MongoDB connesso con successo");
    } catch (error) {
      logger.error(`❌ Errore di connessione al database MongoDB`);
      throw error;
    }
  }

  async createUser(UserCreateInput: Prisma.UserCreateInput): Promise<void> {
    const { telegramId, name, username, alerts } = UserCreateInput;
    try {
      const isUpdated = await this.updateUser(telegramId, { name, username, alerts });
      if (isUpdated) return logger.warn(`Utente già registrato: ${name} - Telegram ID: ${telegramId}`);

      // Se l'utente non esiste, lo creiamo
      await this.prisma.user.create({
        data: {
          telegramId,
          name,
          username: username ?? null, // Assicuro che username sia sempre null se non fornito
        },
      });
      logger.info(`Nuovo utente registrato: ${name} (${telegramId})`);
    } catch (error) {
      throw error;
    }
  }

  private async updateUser(telegramId: number, data: Prisma.UserUpdateInput): Promise<boolean> {
    const { name, username, alerts } = data;
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { telegramId }, include: { alerts: true } });
      if (!existingUser) return false;

      const isDataChanged = existingUser.name !== name || existingUser.username !== username || existingUser.alerts !== alerts;

      if (isDataChanged) {
        await this.prisma.user.update({
          where: { telegramId },
          data: {
            name: name,
            username: username ?? null, // Assicuro che username sia sempre null se non fornito
            alerts: alerts,
          },
          include: {
            alerts: true, // Include gli alerts aggiornati
          },
        });
        logger.info(`Dati utente aggiornati per: ${data.name} (${telegramId})`);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
