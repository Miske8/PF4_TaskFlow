import { handlers } from "@/server/auth/auth";

/** Route Handler Auth.js : /api/auth/* (signin, signout, callback, csrf…). */
export const { GET, POST } = handlers;
