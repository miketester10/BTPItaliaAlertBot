import { User } from "@prisma/client";

export interface CreateUserDto extends Omit<User, "alerts" | "createdAt" | "updatedAt"> {}
