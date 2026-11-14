# Impersonation Battle

A voice-only multiplayer party game that runs in the browser. Each round, one player performs an impression while everyone else listens and types who they think it is.

- **Celebrity Mode**: the performer secretly gets a celebrity to impersonate.
- **Friends Mode**: the performer secretly gets another player in the room to impersonate. The player being imitated can guess too.

Rooms hold 3–60 players, on phones, tablets or computers. Nobody installs an app, and no camera is ever used.

## Status

| Milestone | Scope | State |
|---|---|---|
| 1 | React + Vite web frontend, game-style design | ✅ Done |
| 2 | Room creation and joining (Express + Socket.IO game server) | ✅ Done |
| 3 | Real-time multiplayer lobby | ✅ Done |
| 4 | Celebrity Mode and Friends Mode rounds | Next |
| 5 | Guessing and scoring | |
| 6 | LiveKit browser voice | |
| 7 | Reconnection and error handling during play | |
| 8 | Testing with 3, 10, 30 and 60 players | |
| 9 | Public deployment | |

Rooms, joining and the lobby are real and run on the server. When the host presses **Start Game**, the server checks every start rule: host only, at least 3 connected players, and a mode selected. It then replies that gameplay rounds arrive in the next update, because rounds are Milestone 4. The in-game screens can be previewed in the development **screen gallery** (see "Review the screens" below).

## Design

The site is styled as a party video game, not a website:

- **Main menu.** It shows exactly four options: **Celebrity Mode**, **Friends Mode**, **Create Room** and **Join Room**. The mode you pick is remembered on this device and used when you create a room.
- **Look.** A dark arcade stage with a slowly turning sunburst, halftone dots and floating doodles. Buttons are chunky 3D push-buttons with ink outlines. Text uses cartoon display fonts (Luckiest Guy and Lilita One, self-hosted).
- **Mode colors.** Celebrity Mode is purple and gold, with a superstar in shades under spotlights. Friends Mode is orange and pink, with one buddy doing a bad impression of another.
- **Avatars.** Every player gets a cartoon character generated from their id: color, eyes, mouth and an accessory such as a party hat, shades or a mustache. The same player always looks the same.
- **Animation.** Screens zoom in. Players pop into the lobby one by one. The countdown number punches in every second and shakes in the last five. A live mic shows equalizer bars. The answer slams in like a stamp over spinning rays. The winner gets a podium and confetti.
- **Reduced motion.** If the device asks for reduced motion, animations are turned off.

## How the room system works

- **The server is authoritative.** Every room, player and setting lives on the game server. Browsers send requests such as "join room ABC234" or "change mode". The server checks each one and then sends the full room to everyone in that room. A browser never changes the room on its own.
- **Room codes** are 6 characters from an alphabet without look-alikes (no `0/O`, `1/I/L`). They come from a cryptographic random generator and are checked for uniqueness.
- **Player identity.** Each player gets a public id, shown to the room, and a secret token, sent only to that player's browser tab. The token is how a player reclaims their seat after a reload or a dropped connection. It is never included in what other players receive.
- **Rules enforced on the server:**
  - 60 players at most per room, and 3 connected players to start.
  - Only the host can change the mode or rounds, or start the game.
  - Names must be unique within a room, ignoring case.
  - You can't join a game that has already started.
  - Every request is checked for shape and size.
- **Disconnections.** A player whose connection drops is shown as *Reconnecting* and keeps their seat for 60 seconds. If they come back in that time (the page does this automatically), they get the same seat back with no duplicate. Otherwise the seat is freed.
- **Host handover.** If the host leaves, or their 60 seconds run out, the longest-present connected player becomes host. Empty rooms are deleted.
- **Rooms are separate.** Each room is its own Socket.IO channel. Players only receive updates for their own room, and every action applies only to the sender's own seat.
- **Rate limits.** Each connection gets 30 actions in a burst, then 5 per second. Each IP address can create 10 rooms in a burst, then one more every 6 seconds.
- **No duplicate players.** If the same seat is opened in a second tab, the newest tab keeps it and the old tab is told why. Joining twice from the same connection returns the same seat.

Rooms are kept in the server's memory, because a lobby only exists while people are playing. Restarting the server ends all rooms. PostgreSQL will be added when there is data worth keeping between games; nothing needs it yet.

## Tech stack

| Part | Technology | Licence |
|---|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 8, Socket.IO client, lucide icons | MIT / ISC |
| Fonts | Luckiest Guy, Lilita One, Nunito, self-hosted via Fontsource (no requests to Google at runtime) | OFL |
| Game server | Node.js, Express 5, Socket.IO 4, TypeScript (run with tsx) | MIT |
| Tests | Vitest, Testing Library, jsdom, real Socket.IO clients against a real server | MIT |
| Voice (Milestone 6) | LiveKit SFU (self-hosted) and the LiveKit browser SDK, audio only | Apache-2.0 |

## Project structure

```
WHO/
├── package.json            npm workspaces root (dev, build, start, test, typecheck, lint)
├── .env.example            server settings with defaults
├── shared/                 @ib/shared, used by both client and server
│   └── src/
│       ├── constants.ts    3–60 players, 6-char codes, timings, reconnect grace period
│       ├── types.ts        RoomState, PlayerPublic, PrivatePrompt, RoundResult, scoring
│       ├── protocol.ts     typed Socket.IO events, payloads, acks and error codes
│       ├── validation.ts   name, room-code and guess validation (same rules on both sides)
│       ├── ranking.ts      tie-aware ranking (1, 2, 2, 4)
│       └── events.ts       event name constants
├── server/                 @ib/server, the authoritative game server
│   └── src/
│       ├── index.ts        starts the server
│       ├── app.ts          Express + Socket.IO setup; serves the built site in production
│       ├── config.ts       environment settings
│       ├── rooms/          RoomStore (all room rules), room codes, tokens, ids
│       ├── sockets/        event handlers and payload validation
│       ├── middleware/     rate limiting
│       └── routes/         GET /api/health
└── client/                 @ib/client, the website
    └── src/
        ├── pages/          Home (menu), Create, Join, Room (lobby), Gameplay, Results, Final, 404
        ├── components/     GameTitle, GameButton, ModeTile, Character, Panel, PlayerGrid, ...
        ├── context/        GameProvider (connection, seat, room state), mode chosen on the menu
        ├── services/       socket.ts (connection + requests), session.ts (this tab's seat)
        ├── hooks/ utils/ types/ styles/
        ├── dev/            development-only screen gallery and sample data
        └── test/           test setup
```

### Round timing (Milestone 4)

Each round has two stages that the server controls:

1. **Performing (45s).** The performer's mic is live. Guesses are already open, so a fast correct guess can earn the "first correct" bonus.
2. **Guessing (20s).** The mic is closed and players make their final guesses.

## Requirements

- Node.js 20.19 or newer (developed on Node 22) and npm 10
- Nothing else for now. Docker is only needed from Milestone 6, for LiveKit voice.

## Run it

```bash
npm install          # from the repository root, first time and after pulling changes
npm run dev          # starts the game server (port 3001) and the website (port 5173)
```

Open **http://localhost:5173**. Stop everything with `Ctrl+C`.

In development, the website forwards Socket.IO and `/api` requests to the game server. Browsers, including phones, only ever need the `:5173` address.

Other commands:

```bash
npm run dev:server   # only the game server
npm run dev:client   # only the website (expects the server on :3001)
npm test             # all tests: shared, server (real sockets), client
npm run typecheck
npm run lint
npm run build        # production build of the website (client/dist)
npm start            # production: one server on :3001 serving the website and Socket.IO
```

## Test the room system

### Several players on one computer

Each browser tab is its own player, because the seat is stored per tab.

1. Tab 1: open http://localhost:5173, pick a mode, click **Create Room** and enter a name. You land in the lobby as host, with the code shown on the gold ticket.
2. Tab 2: click **Join Room**, enter another name and the code, or paste the copied invite link. Tab 1 sees the new player pop in immediately.
3. Tab 3: join the same way. The host's **Start Game** button becomes active.
4. Things to check:
   - **Host permissions.** In Tab 2, the mode and rounds are read-only and there's no Start button. In Tab 1, change the mode and Tab 2 updates instantly.
   - **Errors:**
     - a code that doesn't exist: "There's no room with code …"
     - a name already in the room: "Someone in this room is already called …"
     - an empty name, or a code that's too short or has invalid characters: field errors
     - the server stopped (`Ctrl+C` the dev command, then try to join): "Can't reach the game server…"
   - **Leaving.** Click the red leave button in Tab 2; the others see them disappear at once. If the host leaves, the next player becomes host.
   - **Reconnecting.** Reload Tab 3: they come straight back to the same seat with no duplicate. Close Tab 3: the others see *Reconnecting* on their tile, and after 60 seconds the seat is freed.
   - **Isolation.** Create a second room in another tab. The two rooms never see each other.

### A phone or another computer on the same Wi-Fi

1. Run `npm run dev`. Vite prints a **Network** address, such as `http://192.168.1.20:5173`.
2. Open that address on the phone and join with the room code.
3. If it doesn't load, Fedora's firewall is blocking the port. Allow it until the next reboot with:
   ```bash
   sudo firewall-cmd --add-port=5173/tcp
   ```

### Players on different internet connections

Players on other networks (mobile data, another city) need a public address. For a free test without renting a server, run the production build and share it through a temporary tunnel:

```bash
npm run build
npm start                                        # serves everything on http://localhost:3001
cloudflared tunnel --url http://localhost:3001   # in a second terminal
```

`cloudflared` is Cloudflare's free tunnel client, and quick tunnels need no account. It prints an `https://….trycloudflare.com` address that anyone can open. Install it from Fedora's packages or from Cloudflare's website. The tunnel closes when you stop the command. For a permanent public game, see Milestone 9 (deployment).

### Automated tests

`npm test` runs the following:

- **Shared rules:** validation and ranking.
- **Server (19 tests):**
  - The `RoomStore` rules.
  - The full lobby flow over real Socket.IO connections: create and join, live updates, leaving, invalid and unknown codes, taken names, **60 real connections with the 61st refused**, host-only actions, room isolation, disconnect and reconnect with the token, grace-period expiry with host handover, no duplicate seats, forged tokens, and both rate limits.
- **Client:** the screens, including validation messages, host vs. guest controls, and the mode carried from the menu.

## Review the in-game screens

The lobby is live, but rounds come next. To preview the gameplay, results and final screens, open http://localhost:5173/dev/gallery, or use the small link under the menu. The gallery is only included in development builds. Its toolbar switches:

- the screen
- room size: 3, 10, 30 or 60
- your role: host/guest or performer/guesser
- the mode
- voice states such as a blocked mic
- results outcomes, including "everyone guessed" and a tie

## Free vs. paid

Local development is free. Every dependency is open source and everything runs on your own machine.

Costs only appear when you host the game publicly for players on other networks:

- **A server** for the game server and, later, LiveKit. LiveKit needs open UDP ports and bandwidth, which usually means a VPS.
- **Bandwidth and TURN relay traffic** (once voice is added). Players behind strict firewalls or mobile carriers have their audio relayed, which uses server bandwidth.
- **A domain name.** HTTPS is required for microphone access outside `localhost`. Let's Encrypt certificates are free; domains usually are not.

Cloudflare quick tunnels (above) are free for testing. Milestone 9 will cover public deployment step by step. The project does not use any paid APIs.
