/**
 * Prisma Client Singleton
 *
 * This module exports a single instance of the PrismaClient to be used across the application.
 * Using a singleton prevents the creation of multiple instances, which can lead to excessive
 * database connections and potential resource leaks.
 *
 * To gracefully shut down your application, remember to call `prisma.$disconnect()`.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
