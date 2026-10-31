<div align="center">

# 🗂️ TaskFlow

**Clone collaboratif de Trello — tableaux kanban en temps réel**

Next.js App Router · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Auth.js · TanStack Query · dnd-kit · Pusher

[![Tests](https://img.shields.io/badge/tests-114%20passing-brightgreen)](#tests) [![TypeScript](https://img.shields.io/badge/type-strict-blue)](#) [![License](https://img.shields.io/badge/license-MIT-gray)](#)

</div>

---

## 1. Description

**TaskFlow** est une application web de gestion de tâches collaborative (type Trello/Kanban). Plusieurs utilisateurs collaborent sur des **tableaux**, organisés en **colonnes** contenant des **cartes**, avec :

- **drag & drop fluide** (dnd-kit) persisté en base,
- **mises à jour temps réel** entre collaborateurs (Pusher Channels, canaux privés),
- **optimistic updates** avec rollback automatique en cas d'erreur serveur,
- **RBAC strict vérifié côté serveur** sur chaque mutation (`owner` / `member`).

Projet réalisé dans le cadre de mon portfolio pour démontrer une architecture full-stack propre : séparation transport / services métier / data, validation partagée Zod, tests unitaires et UX soignée (dark mode, skeletons, états vides, responsive mobile).

## 2. Démo & captures d'écran

> 🚀 Démo en ligne : _à compléter_ (lien Vercel)

| Dashboard | Kanban | Détail carte |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Board](docs/screenshots/board.png) | ![Card](docs/screenshots/card-modal.png) |

| Membres | Dark mode |
|---|---|
| ![Members](docs/screenshots/members.png) | ![Dark](docs/screenshots/dark-mode.png) |

_Les captures se placent dans `docs/screenshots/` (voir le README du dossier)._

## 3. Fonctionnalités principales

**Authentification**
- Inscription / connexion / déconnexion (credentials, mot de passe hashé bcrypt, cost 12)
- Session JWT Auth.js v5, pages privées protégées par middleware/proxy

**Tableaux (boards)**
- Créer, renommer, supprimer (suppression réservée à l'owner), lister les boards accessibles (owner + member)

**Colonnes & cartes**
- CRUD complet, réordonnancement intra-colonne et inter-colonnes par drag & drop, positions persistées en base
- Titre, description, date d'échéance, labels colorés, commentaires, indicateur visuel de retard

**Collaboration**
- Invitation d'un utilisateur existant par email, rôles `OWNER` / `MEMBER`, retrait de membre (owner only), quitter un board
- Temps réel Pusher : `card:created|updated|moved|deleted`, `list:*`, `board:updated`, `member:added|removed`

**UX**
- Optimistic updates + rollback exact (snapshot du cache)
- Skeletons, états vides, toasts d'erreur, retry
- Recherche de cartes, filtres label / échéance, raccourcis clavier (`Escape`, `Entrée`, `/`)
- Responsive (scroll-snap horizontal sur mobile), dark mode (`next-themes`)

**Qualité**
- ~114 tests Vitest (schémas Zod, permissions, positions, hooks mockés, composants UI)
- Architecture modulaire feature-first + couche serveur isolée

## 4. Stack technique

| Domaine | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Route Handlers) |
| Langage | TypeScript (mode strict) |
| Styles | Tailwind CSS v4 + `clsx` + `tailwind-merge`, dark mode via `next-themes` |
| Base de données | PostgreSQL + Prisma ORM (driver adapter `@prisma/adapter-pg`) |
| Auth | Auth.js / NextAuth v5 (provider Credentials + bcryptjs) |
| Validation | Zod (schémas partagés client ↔ serveur) |
| Data fetching | TanStack Query v5 (mutations optimistes, invalidation ciblée) |
| Drag & drop | dnd-kit (`core`, `sortable`, `utilities`) |
| Temps réel | Pusher Channels (`pusher` serveur / `pusher-js` client, canaux privés) |
| Dates | date-fns v4 (locale FR) |
| Icônes | lucide-react |
| Tests | Vitest + Testing Library (jsdom) |

## 5. Architecture du projet

```
src/
├── app/                      # Routes (App Router)
│   ├── (auth)/               # login, register (public)
│   ├── (app)/                # dashboard, boards/[boardId] (privé)
│   ├── api/                  # Route Handlers = seule porte d'entrée des mutations
│   │   ├── boards/…          #   boards, lists, reorder, members, labels
│   │   ├── cards/…           #   détail/update/delete carte, labels carte
│   │   └── pusher/auth/      #   signature des canaux privés (server-side)
│   └── layout.tsx            # Providers (QueryClient, Theme, Session)
├── components/
│   ├── ui/                   # Design system brut (Button, Modal, Badge, Skeleton…)
│   ├── layout/               # Header, Sidebar, ThemeToggle
│   └── providers/            # QueryProvider, ThemeProvider, SessionProvider
├── features/                 # Domaines métier autonomes (components + hooks + lib)
│   ├── auth/  boards/  columns/  cards/  labels/  members/  realtime/
├── hooks/                    # Hooks transverses (useHotkey, useDebounce…)
├── lib/                      # Utilitaires client-safe : env.ts (Zod), utils (cn),
│   └── validations/          # Schémas Zod partagés (board, list, card, label, member)
├── server/                   # ⛔ Jamais importé côté client
│   ├── db/prisma.ts          # Singleton PrismaClient (HMR-safe, adapter pg)
│   ├── auth/                 # Config Auth.js, requireUser, policies RBAC
│   ├── services/             # Logique métier pure + gates d'autorisation + émissions Pusher
│   └── realtime/             # Client Pusher serveur, canaux, catalogue d'événements typés
├── types/                    # DTO API, enums, inférences z.infer
└── tests/                    # Vitest : unit + integration + setup
```

**Flux d'une mutation :** composant → hook TanStack Query (optimistic update du cache) → route API → `requireBoardAccess/Owner` (RBAC) → service (validation Zod + Prisma transaction + émission Pusher) → réponse typée → revalidation ciblée. Les autres clients reçoivent l'événement Pusher et patchent leur cache (l'émetteur est ignoré grâce à `originUserId` → pas de double application ni de boucle).

## 6. Prérequis

- **Node.js ≥ 20** (LTS recommandé)
- **PostgreSQL ≥ 14** (local, Docker ou managé)
- Un compte **Pusher** (plan gratuit Sandbox suffit) — optionnel : l'app fonctionne sans, le temps réel est désactivé avec fallback UI

## 7. Installation en local

```bash
# 1. Cloner
git clone https://github.com/<ton-user>/taskflow.git && cd taskflow

# 2. Installer
npm install

# 3. Configurer l'environnement
cp .env.example .env        # puis renseigner DATABASE_URL, AUTH_SECRET et Pusher

# 4. Base de données (exemple avec Docker)
docker run -d --name taskflow-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=taskflow -p 5432:5432 postgres:15-alpine

# 5. Schéma + client Prisma
npx prisma migrate dev       # applique les migrations locales
npx prisma generate

# 6. Lancer
npm run dev                  # http://localhost:3000
```

Créer un compte via `/register`, puis un tableau depuis le dashboard. Pour tester la collaboration : deux navigateurs (ou fenêtre privée) avec deux comptes, inviter le second par email.

## 8. Variables d'environnement

Toutes sont documentées dans [`.env.example`](.env.example) et **validées au boot par Zod** (`src/lib/env.ts`, fail-fast en production).

```bash
# --- Database (PostgreSQL) ---
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow?schema=public&connection_limit=1"

# --- Auth.js (NextAuth v5) ---
AUTH_SECRET="<openssl rand -base64 32>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# --- Pusher (côté serveur — secrets JAMAIS exposés au client) ---
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="mt1"

# --- Pusher (côté client — publiques uniquement) ---
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"
```

## 9. Commandes disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm start` | Servir le build |
| `npm run lint` | ESLint |
| `npm test` | Suite Vitest complète |
| `npm run test:watch` | Vitest en watch mode |
| `npm run db:migrate` | `prisma migrate dev` (migration locale) |
| `npm run db:deploy` | `prisma migrate deploy` (production/CI) |
| `npm run db:generate` | Régénérer le client Prisma |
| `npm run db:studio` | Prisma Studio (exploration des données) |

## 10. Configuration Pusher (temps réel)

1. Créer une app sur [pusher.com](https://dashboard.pusher.com) (cluster au choix, ex. `mt1`).
2. Côté **serveur** : `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`.
3. Côté **client** : uniquement `NEXT_PUBLIC_PUSHER_KEY` + `NEXT_PUBLIC_PUSHER_CLUSTER`.
4. Dans le dashboard Pusher → **Native Authentication** : cocher *Private* et *Presence*, autoriser `GET,POST` vers `/api/pusher/auth`.
5. Canaux utilisés : `private-board-{boardId}`. L'endpoint d'auth vérifie la session JWT **et** l'appartenance au board avant de signer — un utilisateur non membre reçoit un 403 et ne peut pas s'abonner.
6. Émissions volontairement *best-effort* : si Pusher est absent/mal configuré, les mutations réussissent quand même et le client bascule sur un fallback (bannière « temps réel désactivé » + revalidation TanStack Query).

## 11. Base de données (PostgreSQL)

- Modèles : `User`, `Board`, `BoardMember` (rôle OWNER/MEMBER), `List`, `Card`, `Label` (enum couleurs), `CardLabel` (N:N), `Comment`, `CardAssignee`, `ActivityLog`.
- Intégrité : suppressions en cascade le long de la hiérarchie Board → List → Card → Comment/CardLabel ; contraintes d'unicité sur `User.email`, `BoardMember(boardId,userId)`, `Label(boardId,name)`.
- Index clés : `cards(listId, order)` (chemin critique du DnD), `lists(boardId, order)`, `board_members(userId)`, `activity_logs(boardId, createdAt DESC)`.
- Migrations versionnées dans `prisma/migrations/` — en prod, uniquement `prisma migrate deploy` (jamais `db push`).

## 12. Choix techniques importants

| Choix | Pourquoi |
|---|---|
| **Fractional indexing (`Float order`)** | Insérer entre deux éléments = `(prev+next)/2`, écriture O(1) sans renuméroter les voisins → idéal optimistic updates + multi-utilisateurs. Garde-fou : relinéarisation en 1..n (transaction) si l'écart devient < 1e-8. |
| **Canaux Pusher privés + endpoint d'auth serveur** | Aucun secret exposé ; l'accès à un flux temps réel est exactement le même gate RBAC que l'accès aux données. |
| **Événements porteurs de `originUserId`** | Le client qui a fait la mutation ignore ses propres événements (son optimistic update a déjà gagné) → pas de flicker, pas de doublon, pas de boucle infinie. |
| **Temps réel = invalidation/patch de cache, pas de state manuel** | Pusher ne fait que synchroniser TanStack Query : une seule source de vérité côté client, logique DnD inchangée. |
| **Services serveur + policies centralisées** | Chaque route appelle `requireBoardAccess` / `requireBoardOwner` avant tout accès Prisma ; l'autorisation n'existe qu'en un seul endroit, testable unitairement. |
| **Schémas Zod partagés** | Un seul contrat de validation pour le formulaire client ET la route API ; types inférés (`z.infer`) = zéro dérive. |
| **Prisma 7 + driver adapter pg** | Compatible serverless (Vercel), connexions bornées (`connection_limit=1`), pas d'engine binaire. |
| **Pas de WebSocket custom** | Pusher Channels évite de gérer scaling/état/sticky sessions sur l'hébergement Next.js serverless. |
| **Auth.js v5 JWT (sans adapter DB pour les sessions)** | Strategy credentials + JWT : middleware edge-compatible, pas de table Account/Session inutile pour le MVP. |

## 13. Déploiement

### Vercel (recommandé)

```bash
npm i -g vercel
vercel link
vercel --prod
```

1. Importer le repo GitHub dans Vercel (framework auto-détecté : Next.js).
2. Ajouter les variables d'environnement (voir §14), dont `NEXT_PUBLIC_APP_URL=https://taskflow.vercel.app`.
3. Build command : `prisma migrate deploy && next build` (ou `postinstall: prisma generate` déjà en place).
4. Après le premier déploiement : mettre à jour **Pusher → Native Authentication** avec l'URL `https://<domaine>/api/pusher/auth` et activer les WebSockets en production.

### Variables d'environnement de production

| Variable | Où | Note |
|---|---|---|
| `DATABASE_URL` | Secret | URL de la base managée (Neon/Supabase/RDS) |
| `DIRECT_URL` *(si pooler)* | Secret | Voir recommandations §14 |
| `AUTH_SECRET` | Secret | `openssl rand -base64 32`, différent du dev |
| `NEXT_PUBLIC_APP_URL` | Public | URL exacte du déploiement |
| `PUSHER_APP_ID/KEY/SECRET/CLUSTER` | Secret | Secrets jamais préfixés `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_PUSHER_KEY/CLUSTER` | Public | Seules valeurs Pusher exposées au navigateur |

### Recommandations PostgreSQL en production

- **Managé** : Neon ou Supabase (serverless) — support natif du driver `pg` utilisé par l'adapter Prisma.
- **Pooler obligatoire en serverless** : utiliser le connecteur pooled (port 6543 chez Supabase/pgBouncer, mode transaction) avec `connection_limit=1`, et une `DIRECT_URL` non poolée pour les migrations (`prisma migrate deploy`).
- Sauvegardes quotidiennes + PITR si activable ; monitoring connexions/lenteurs (`pg_stat_statements`).
- Migrations versionnées et rejouables ; ne jamais éditer une migration appliquée en prod.
- SSL explicite (`?sslmode=require` / `channel-binding=verify-full` selon le fournisseur).

### Recommandations Pusher en production

- Passer du plan Sandbox au plan payant dès que nécessaire (limite gratuite : 200 connexions simultanées, ~100k messages/jour).
- Restreindre CORS/webhooks au domaine de prod ; garder **Private channels** activés pour tous les canaux board.
- Payloads légers (< 10 ko) : on n'envoie que des IDs + champs utiles, le client va chercher le reste via l'API/cache.
- Désactivation contrôlée : si les vars Pusher sont absentes, l'app reste fonctionnelle (fallback) — utile pour un preview Vercel sans secrets.

## 14. Prochaines améliorations possibles

- [ ] Invitations par email réel (Resend) avec lien d'acceptation et statut `pending`
- [ ] Transfert de propriété d'un board et suppression de compte
- [ ] Check-lists (sous-tâches) et pièces jointes sur les cartes
- [ ] Vue « liste » et filtres persistants par utilisateur
- [ ] Historique d'activité complet (le modèle `ActivityLog` est prêt) + notifications in-app
- [ ] Presence Pusher (« qui regarde ce board ? ») et curseurs live
- [ ] Tests E2E Playwright (parcours d'invitation + DnD complet)
- [ ] CI GitHub Actions (lint + typecheck + tests + build) et preview environments
- [ ] i18n FR/EN, accessibilité avancée (annonces ARIA du DnD)
- [ ] Rate limiting (upstash) sur les routes d'auth et de mutation

## 15. Ce que ce projet m'a appris

- **Ordonner sans verrouiller** : le fractional indexing résout élégamment la concurrence du drag & drop multi-utilisateurs — bien plus robuste que des index entiers `position = i`.
- **Optimistic updates ≠ refetch** : snapshot du cache TanStack Query, patch local, rollback exact en `onError`, revalidation douce en `onSettled` — et l'interaction avec le temps réel (ignorer ses propres événements via `originUserId`) est le vrai sujet délicat.
- **Sécurité serveur d'abord** : masquer des boutons côté client n'est pas une autorisation ; centraliser les gates RBAC dans les services (et les tester) rend chaque route trivialement sûre.
- **Les canaux temps réel sont une surface d'attaque comme les API** : un canal privé doit avoir exactement le même contrôle d'accès que la ressource qu'il diffuse.
- **Découpler les couches paie** : la bascule Prisma 6→7 (config hors schéma, adapter pg), l'ajout de Pusher ou le passage en canaux privés n'ont touché que la couche concernée.
- **La qualité est une feature** : schémas Zod partagés, env validés au boot, ~114 tests et un design system minuscule mais cohérent font la différence perçue dans un portfolio.

---

## License

MIT — librement réutilisable pour l'apprentissage.

<details>
<summary>🧪 Lancer les tests</summary>

```bash
npm test              # suite complète (~114 tests)
npm run test:watch    # watch mode
```

Couverture : validations Zod (board/list/card/label/member/auth), helpers de permissions RBAC, stratégie de position (midpoint, densité, relinéarisation), dates/échéances, filtrage de cartes, hook de mutation mocké (succès/403/Zod), composants UI (Badge…), + tests d'intégration PostgreSQL (isolation par board frais).
</details>
