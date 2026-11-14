# Impersonation Battle

A voice-only multiplayer party game that runs in the browser. Each round, one player performs an impression while everyone else listens and types who they think it is.

- **Celebrity Mode**: the performer secretly gets a celebrity to impersonate.
- **Friends Mode**: the performer secretly gets another player in the room to impersonate. The player being imitated can guess too.

Rooms hold 3–60 players, on phones, tablets or computers. Nobody installs an app, and no camera is ever used.

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | React + Vite web frontend and responsive design | ✅ Done |
| 2 | Room creation and joining (Express + Socket.IO server, PostgreSQL/Prisma) | Next |
| 3 | Socket.IO multiplayer lobby | |
| 4 | Celebrity Mode and Friends Mode | |
| 5 | Guessing and scoring | |
| 6 | LiveKit browser voice | |
| 7 | Reconnection and error handling | |
| 8 | Testing with 3, 10, 30 and 60 players | |
| 9 | Public deployment | |

There is no game server yet, so **Create Room** and **Join Room** check what you type and then show a clear "can't reach the game server" message. They do not pretend to work. To review the in-room pages now, use the development **screen gallery** described below.

## Tech stack

| Part | Technology | Licence |
|---|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 8, lucide icons | MIT / ISC |
| Display font | Bricolage Grotesque, self-hosted via Fontsource (no requests to Google at runtime) | OFL |
| Tests | Vitest, Testing Library, jsdom | MIT |
| Backend (Milestone 2+) | Node.js, Express, Socket.IO, Prisma, PostgreSQL | MIT / Apache-2.0 / PostgreSQL |
| Voice (Milestone 6) | LiveKit SFU (self-hosted) and the LiveKit browser SDK, audio only | Apache-2.0 |

## Project structure

```
WHO/
├── package.json          npm workspaces root: dev, build, test, typecheck, lint
├── shared/               @ib/shared, used by the client now and the server from Milestone 2
│   └── src/
│       ├── constants.ts  3–60 players, room-code alphabet, 45s performance / 20s guessing
│       ├── types.ts      RoomState, PlayerPublic, PrivatePrompt, RoundResult, scoring config
│       ├── validation.ts name, room-code and guess validation (same rules on both sides)
│       ├── ranking.ts    tie-aware ranking (1, 2, 2, 4)
│       └── events.ts     Socket.IO event names
└── client/               @ib/client, the website
    └── src/
        ├── pages/        Home, Create, Join, Lobby, Mode Selection, Gameplay, Results, Final, 404
        ├── components/   PageShell, Button, TextField, PlayerGrid, CountdownTimer, Leaderboard, ...
        ├── hooks/        useCountdown (server-time display), useCopy (clipboard)
        ├── services/     rooms.ts: room actions (they report "no server" until Milestone 2)
        ├── types/        voice and mic status
        ├── utils/        helpers (start rules, round deltas, invite links, ...)
        ├── styles/       Tailwind theme, animations, base styles
        ├── dev/          development-only screen gallery and sample data
        └── test/         test setup
```

`server/`, `docker-compose.yml` and `.env.example` are added in Milestone 2.

Pages receive data as props and report user actions through callbacks such as `onSubmitGuess` and `onStart`. They contain no game rules. From Milestone 3 the server sends the room state, and the page shown inside a room follows the server's phase, so a player can't navigate their way into a state the server hasn't reached.

### Round timing

Each round has two stages that the server controls:

1. **Performing (45s).** The performer's mic is live. Guesses are already open, so a fast correct guess can earn the "first correct" bonus.
2. **Guessing (20s).** The mic is closed and players make their final guesses.

The answer is then revealed, the results stay on screen for 10s, and the next round starts automatically. The host can skip ahead.

## Requirements

- Node.js 20.19 or newer (developed on Node 22) and npm 10
- Docker with Docker Compose, from Milestone 2 (PostgreSQL) and Milestone 6 (LiveKit)

## Run it

```bash
npm install          # from the repository root
npm run dev          # http://localhost:5173
```

The dev server also listens on your local network, so a phone on the same Wi-Fi can open the site at the "Network" address Vite prints. A phone needs that during development only; once deployed, players open the public URL.

Other commands:

```bash
npm test             # unit and component tests (shared + client)
npm run typecheck
npm run lint
npm run build        # production build in client/dist
```

## Review the pages

1. Run `npm run dev` and open http://localhost:5173.
2. **Create Room / Join Room**: submit with empty or invalid input to see validation messages. For example, the code `ABC` is too short and `ABCD0` contains a character room codes never use. Open http://localhost:5173/join?code=k7qx4 to see an invite link fill in the code.
3. **Screen gallery**: use the link at the bottom of the home page, or go to http://localhost:5173/dev/gallery. It is only included in development builds. The toolbar switches:
   - the page: Lobby, Mode, Performing, Guessing, Results, Final
   - room size: 3, 10, 30 or 60 players
   - your role: Host or Guest, or in gameplay, Performer or Guesser
   - the mode: Celebrity or Friends
   - the voice state: OK, mic permission pending, mic blocked, no mic, voice failed, or audio paused by the browser
   - the outcome: "everyone guessed" on Results, a tie on Final
4. Things to try:
   - As host in the Lobby, choose a mode, change the rounds, then press **Start Game**.
   - As a guesser, try some answers. The gallery's answer is `Morgan Freeman` in Celebrity Mode and `Mei` in Friends Mode, and wrong guesses use up tries.
   - In Friends Mode with 60 players, type part of a name to filter the name suggestions.
5. **Responsive check**: use your browser's device toolbar (Ctrl+Shift+M in Chrome or Firefox). On phones, pages stack in a single column. At 1024px and wider, the Lobby, Gameplay and Results pages switch to two columns.

## Free vs. paid

Local development is free. Every dependency is open source, and PostgreSQL and LiveKit will run on your own machine in Docker.

Costs only appear when you host the game publicly for players on other networks:

- **A server** for the backend, PostgreSQL and LiveKit. LiveKit needs open UDP ports and bandwidth, which usually means a VPS.
- **Bandwidth and TURN relay traffic.** Players behind strict firewalls or mobile carriers have their audio relayed through TURN, which uses server bandwidth.
- **A domain name.** HTTPS is required for microphone access outside `localhost`. Let's Encrypt certificates are free; domains usually are not.

Milestone 9 will cover public deployment step by step. The project does not use any paid APIs.
