import bcrypt from "bcryptjs";

/**
 * TaskFlow — hachage sécurisé des mots de passe (bcrypt, cost 12).
 * Utilisé par la Server Action d'inscription et le callback `authorize`.
 */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
