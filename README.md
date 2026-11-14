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
| 4 | Celebrity Mode and Friends Mode rounds | ✅ Done |
| 5 | Guessing and scoring | ✅ Done |
| 6 | LiveKit browser voice | ✅ Done (local; public deployment untested) |
| 7 | Reconnection and error handling during play | Next |
| 8 | Testing with 3, 10, 30 and 60 players | |
| 9 | Public deployment | |

The whole game runs on the server: rooms, the lobby, rounds, guessing, scoring and the final results. Voice chat runs on LiveKit. It has been tested end to end with a local LiveKit server, but playing across different networks needs a publicly reachable LiveKit server, and that hasn't been tested yet (see "Deploy voice").

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

## How a game works

1. The host presses **Start Game**. The server needs at least 3 connected players and a selected mode.
2. Each round, the server picks a **performer**. Performers come from a shuffled deck, so nobody performs twice until everyone has had a turn.
3. Only the performer receives the **secret**, through a private message to their own connection:
   - **Celebrity Mode:** a Tamil celebrity's name and photo, from a deck that doesn't repeat until all photographed celebrities have been used.
   - **Friends Mode:** another player's name and avatar. It is never the performer, and the imitated player can guess too.
4. **Performing (45s), then final guesses (20s).** Countdowns use server timestamps, so every device shows the same time. Guesses are accepted during both stages, so fast listeners can earn the first-correct bonus. The round ends early once every connected guesser has either got it or used all 5 guesses.
5. **Guessing rules:**
   - The performer can't guess.
   - Empty guesses are refused, and so is the same guess twice.
   - Each player gets 5 guesses.
   - Once you're right, you're locked in.
   - Players can see whether their own guess was right, but the answer itself stays hidden until the reveal.
6. **Scoring, all on the server:**
   - 100 points for a correct guess, plus 50 for the first correct guess.
   - 100 for the performer if every eligible guesser gets it.
   - Each award is applied exactly once.
7. **Reveal.** The celebrity's name and photo, or the friend's name and avatar, then who got it, the points, and the updated leaderboard. The next round starts after 10 seconds, or straight away if the host skips.
8. **After the last round:** the winner, a podium, and the final rankings. The host can **Play Again** (same players, scores reset) or **Return to Lobby**.

**Disconnections:**
- **Performer drops mid-performance:** the round skips to final guesses.
- **A guesser drops:** they stop counting toward "everyone guessed".
- **Fewer than 2 players connected:** the game ends with the scores so far.
- **Host leaves:** the host role passes on as in the lobby.
- **Reconnecting mid-round:** the player gets the round back, including the performer's secret.

### Answer matching

Guesses are checked on the server. Case, accents, punctuation and spaces are ignored, and so are common honorifics such as "Thalapathy" or "Actor". Every celebrity has aliases: Vijay accepts *Thalapathy Vijay*, *Ilayathalapathy* and *Joseph Vijay*; Silambarasan accepts *STR* and *Simbu*; MGR accepts *M. G. Ramachandran*; and so on.

Small typos are forgiven on longer names: none for 4 letters or fewer, 1 typo up to 8 letters, and 2 beyond that. A typo only counts if the guess isn't an equally close match for someone else, so *Vishal* is never accepted for *Vishnu Vishal*, and *Vijay* never for *Vijay Sethupathi*. Friends Mode uses the same rule against every player's name in the room.

### Celebrity database

`server/src/prompts/celebrities.ts` holds 60 Tamil cinema stars: 30 heroes and 30 heroines. Each has an id, name, display name, category, photo, aliases and photo credit. The file lives on the server only, so answers never ship to the browser.

**Photos** are in `client/public/images/celebrities/`:

- **Source:** Wikimedia Commons. Every one is freely licensed (CC BY, CC BY-SA, CC0 or GODL-India) and was taken from the person's own Wikipedia article or the Commons file named for them.
- **Size:** resized to at most 420×560, with metadata removed, about 34 KB each.
- **Credits:** author and license for each photo are in [`CREDITS.md`](client/public/images/celebrities/CREDITS.md). A short credit line is also shown under the photo in the game.
- **If a photo fails to load,** a styled placeholder with the name appears instead.

**No free photo exists yet for four people:** Raghava Lawrence, Pradeep Ranganathan, Harish Kalyan and Ivana. They stay in the database, but the game doesn't pick them, so a round never shows a celebrity without a photo. To enable one:

1. Add a photo you have the right to use as `client/public/images/celebrities/<id>.jpg`.
2. In `celebrities.ts`, set `image` and `credit` for that entry.

**Adding a new celebrity:** add an entry and a photo the same way. The tests check that every photo exists, is a JPEG, isn't shared with anyone else, and that every alias points to exactly one celebrity.

## Voice chat

Every game room has its own LiveKit voice room. Everyone in it can talk and hear each other: the performer does the impression, and everyone else listens and types guesses as before. Game rules, timers and scoring are unchanged.

- **Joining.** A player joins their room's voice chat automatically once they have a seat. They stay connected across the lobby, every round, the results and Play Again, using one connection the whole time. Leaving the room disconnects them from voice.
- **Microphone.**
  - Mics start **off**. The browser only asks for permission when the player taps **Turn on mic**.
  - Anyone can mute at any time. Muting releases the microphone, so the browser's mic light goes off.
  - If it's the performer's turn and their mic is off, they get a clear prompt to turn it on.
- **Voice panel.** A dock pinned to the bottom of every in-room screen shows:
  - the voice status (on, joining, reconnecting or failed, with a Retry button)
  - **Tap to hear**, when the browser blocks sound until the player taps
  - the mic button: Turn on mic / Mute / Allow mic… / Try mic again
- **Speaking indicators.** A lime ring pulses around the avatar of anyone who is speaking, based on LiveKit's audio levels. A small mic badge shows whose mic is on. The performer's spotlight shows "Speaking" and moving bars while they talk.
- **Errors, with clear messages:**
  - microphone permission denied
  - no microphone
  - microphone busy in another app
  - microphone unplugged mid-game
  - page not on HTTPS (browsers require it for microphones)
  - voice server unreachable (it retries automatically, then shows "No voice" with Retry; the game keeps working)
  - voice dropping and reconnecting
  - the same player opening a second tab
- **Security.**
  - Voice tokens are made only on the game server, only for a player seated in that room, for that room's voice room only, with the player's id as their identity.
  - Tokens allow microphone audio only. LiveKit refuses camera and screen-share tracks.
  - The API secret never leaves the server.
  - Because the identity is the player id, a reconnect or second tab replaces the old voice connection rather than creating a duplicate.
- **No camera or video**, anywhere.

### Deploy voice (players on different networks)

Players on different Wi-Fi networks, mobile data or other countries need a **publicly reachable LiveKit server** with a TURN relay. The local development LiveKit only works on your own network. These steps have **not** been tested yet.

1. **Server.** Get a Linux VPS with a public IP. A small one is enough for a few rooms, but audio bandwidth grows with players: roughly 50 kbit/s per listener for each speaker.
2. **DNS.** Point three names at the server, for example `play.example.com` (game), `voice.example.com` (LiveKit) and `turn.example.com` (TURN relay).
3. **Firewall.** Open these ports:

   | Ports | Protocol | Used for |
   |---|---|---|
   | 80, 443 | TCP | HTTPS and secure WebSockets |
   | 7881 | TCP | WebRTC over TCP |
   | 50000–60000 | UDP | WebRTC media |
   | 3478 | UDP | TURN |
   | 5349 | TCP | TURN over TLS |
   | 30000–40000 | UDP | TURN relay |

4. **LiveKit.**
   - Install LiveKit: `bash scripts/get-livekit.sh` on the server, or the official `livekit/livekit-server` Docker image.
   - Edit the domains in [`livekit/livekit.yaml`](livekit/livekit.yaml) and point `cert_file` / `key_file` at a certificate for the TURN domain (certbot or Caddy can issue it).
   - Make an API key and a long random secret.
   - Run:
     ```bash
     LIVEKIT_KEYS="<key>: <secret>" livekit-server --config livekit/livekit.yaml
     ```
5. **HTTPS.** Put Caddy in front, using [`livekit/Caddyfile.example`](livekit/Caddyfile.example). Caddy gets free Let's Encrypt certificates automatically, and gives `https://play.example.com` and `wss://voice.example.com`.
6. **Game server.** Set the environment variables and start it:
   ```bash
   LIVEKIT_URL=wss://voice.example.com LIVEKIT_API_KEY=<key> LIVEKIT_API_SECRET=<secret> \
     TRUST_PROXY=true npm start
   ```
7. **Test.** Join from a phone on mobile data and a computer on a different Wi-Fi network. Check that both hear each other, and that the voice panel says *Voice on*.

LiveKit's own [self-hosting guide](https://docs.livekit.io/home/self-hosting/deployment/) covers more setups. An alternative to self-hosting is LiveKit Cloud: set the three variables to your Cloud project's values. It's a third-party hosted service with a free tier and paid plans beyond it.

## Tech stack

| Part | Technology | Licence |
|---|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 8, Socket.IO client, lucide icons | MIT / ISC |
| Fonts | Luckiest Guy, Lilita One, Nunito, self-hosted via Fontsource (no requests to Google at runtime) | OFL |
| Game server | Node.js, Express 5, Socket.IO 4, TypeScript (run with tsx) | MIT |
| Tests | Vitest, Testing Library, jsdom, real Socket.IO clients against a real server | MIT |
| Voice | LiveKit server 1.13 (self-hosted), livekit-server-sdk (tokens), livekit-client (browser), audio only | Apache-2.0 |

## Project structure

```
WHO/
├── package.json            npm workspaces root (dev, build, start, test, typecheck, lint)
├── .env.example            server + LiveKit settings with defaults
├── livekit/                production LiveKit config (TURN) and example Caddyfile
├── scripts/                get-livekit.sh (download + verify LiveKit), dev-voice.sh
├── .tools/                 (git-ignored) local LiveKit binary for development
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
│       ├── game/           GameEngine (rounds, timers, scoring), answer matching, no-repeat decks
│       ├── prompts/        celebrities.ts (60 Tamil stars: aliases, photo, credit)
│       ├── sockets/        event handlers and payload validation
│       ├── livekit/        voice tokens (room-scoped, mic-only) and voice room cleanup
│       ├── middleware/     rate limiting
│       └── routes/         GET /api/health
└── client/                 @ib/client, the website
    └── src/
        ├── pages/          Home (menu), Create, Join, Room (lobby → gameplay → results → final), 404
        ├── public/images/celebrities/   the 56 celebrity photos + CREDITS.md
        ├── components/     GameTitle, GameButton, ModeTile, Character, Panel, PlayerGrid, ...
        ├── context/        GameProvider (connection, seat, room state), mode chosen on the menu
        ├── voice/          VoiceProvider (LiveKit connection, mic, speaking, retries), mic error messages
        ├── services/       socket.ts (connection + requests), session.ts (this tab's seat)
        ├── hooks/ utils/ types/ styles/
        ├── dev/            development-only screen gallery and sample data
        └── test/           test setup
```

## Requirements

- Node.js 20.19 or newer (developed on Node 22) and npm 10
- Linux or macOS for the local voice server. `npm run dev` downloads LiveKit's official binary on first run (about 19 MB, checksum-verified, into `.tools/`). No Docker or `sudo` needed.

## Run it

```bash
npm install          # from the repository root, first time and after pulling changes
npm run dev          # game server (:3001) + website (:5173) + local LiveKit voice (:7880)
```

Open **http://localhost:5173**. Stop everything with `Ctrl+C`.

In development, the website forwards Socket.IO and `/api` to the game server, and `/livekit` to LiveKit. Browsers, including phones, only ever need the `:5173` address. The local LiveKit uses its built-in development keys, so no `.env` is needed.

Other commands:

```bash
npm run dev:server   # only the game server
npm run dev:client   # only the website (expects the server on :3001)
npm run dev:voice    # only the local LiveKit server
npm run voice:install # (re)download the LiveKit binary into .tools/
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

### Voice on one computer

1. In each tab, wait for **Voice on** in the panel at the bottom, then tap **Turn on mic** and allow the microphone.
2. Talk. The speaking ring lights up around your avatar in the other tabs. Use headphones, or every tab will play the others back into your mic.
3. Tap **Mute**. Your mic badge disappears for the others.
4. Start a game and play rounds. The voice panel stays on *Voice on* the whole time, with no reconnects.
5. Reload a tab: it rejoins voice automatically. Leave the room: you drop out of voice for everyone.

### A phone or another computer on the same Wi-Fi

1. Run `npm run dev`. Vite prints a **Network** address, such as `http://192.168.1.20:5173`.
2. Open that address on the phone and join with the room code.
3. If it doesn't load, Fedora's firewall is blocking the port. Allow the game and voice ports until the next reboot with:
   ```bash
   sudo firewall-cmd --add-port=5173/tcp --add-port=7881/tcp --add-port=7882/udp
   ```
4. **Voice on a phone:** to **speak**, browsers require HTTPS for the microphone, so a phone on `http://192.168…` can't use its mic. Use the tunnel below or a real deployment. Listening over plain `http://` should work, since HTTPS is only needed to capture audio, but that hasn't been tested on a real phone.

### Players on different internet connections

Players on other networks (mobile data, another city) need a public address. For a free test without renting a server, run the production build and share it through a temporary tunnel:

```bash
npm run build
npm start                                        # serves everything on http://localhost:3001
cloudflared tunnel --url http://localhost:3001   # in a second terminal
```

`cloudflared` is Cloudflare's free tunnel client, and quick tunnels need no account. It prints an `https://….trycloudflare.com` address that anyone can open. Install it from Fedora's packages or from Cloudflare's website. The tunnel closes when you stop the command. For a permanent public game, see Milestone 9 (deployment).

**Voice through a tunnel:** the tunnel carries the website, the game and LiveKit's connection setup, but **not the audio itself**. Audio needs a LiveKit server that players' devices can reach directly, or a TURN relay. A LiveKit server running on your home computer usually can't be reached from other networks. To play with voice across networks, use a public LiveKit server (see "Deploy voice") and point the game server at it with the three `LIVEKIT_*` variables.

### Play a full game

With the three tabs from above, start the game and then:

1. The performer's tab shows **TOP SECRET** with the photo, or the friend's avatar. The other tabs show only who is performing and the countdown.
2. In another tab, type a wrong guess. You'll see "Nope!" and a guess used up. Typing the same guess again is refused.
3. Type the right answer, or an alias such as *Thalapathy*, in both guessing tabs. Once everyone has it, the round ends early: everyone sees the photo and name, who got it (+150 for the first, +100 for the second) and +100 for the performer.
4. As host, press **Next round now** to skip the 10-second wait. After the last round, the podium appears. **Play Again** restarts with fresh scores, and **Return to Lobby** goes back to the lobby.
5. To see the game handle a dropout, close the performer's tab mid-round. The round skips to final guesses and carries on.

### Automated tests

`npm test` runs the following:

- **Shared rules:** validation and ranking.
- **Server (19 tests):**
  - The `RoomStore` rules.
  - The full lobby flow over real Socket.IO connections: create and join, live updates, leaving, invalid and unknown codes, taken names, **60 real connections with the 61st refused**, host-only actions, room isolation, disconnect and reconnect with the token, grace-period expiry with host handover, no duplicate seats, forged tokens, and both rate limits.
- **Game (15 tests):**
  - **Celebrity database:** 60 entries, every photo present and unique, and every alias resolving to only its own celebrity.
  - **Answer matching:** aliases, typos and look-alike names.
  - **Full games over real sockets, in both modes:**
    - Every event other players receive is recorded and checked for the secret name or photo before the reveal.
    - Guess rules, the first-correct and performer bonuses, and each award counted only once.
    - Fair performer rotation, every round played, and the final results.
    - Play Again, Return to Lobby, host-only skipping.
    - The performer disconnecting and reconnecting, and the game ending safely when too few players remain.
- **Voice (4 server tests):**
  - Only seated players get a token.
  - Each token is signed for the right room and identity, with microphone-only permissions, and the secret is never sent.
  - Different game rooms get different voice rooms.
  - Players who have left are refused.
  - Reconnected players get the same identity.
  - Voice reports as unavailable when it isn't configured.
- **Client:** the screens, including:
  - validation messages, host vs. guest controls, and the mode carried from the menu
  - the photo appearing only on the performer's screen
  - the voice panel in every state
  - microphone error messages
  - speaking indicators
  - the performer's "turn on your mic" prompt

**Voice end to end** was checked with a local LiveKit server and three Chromium sessions using a speech-like fake microphone, in both modes:

- All three joined the same voice room, with no duplicates.
- Each received and played the other two players' audio.
- Mic badges and speaking rings updated live.
- Mute was seen by the others.
- No reconnects happened across rounds.
- A reload rejoined, and leaving removed the player from voice.
- Permission denied, and the voice server going down and coming back, both showed clear messages.

**Not yet tested:** real phones (Android Chrome, iPhone Safari), Edge, Firefox, and players on different networks against a public LiveKit server.

## Screen gallery (development)

To preview any screen with sample data, including every voice-panel state, open http://localhost:5173/dev/gallery, or use the small link under the menu. The gallery is only included in development builds. Its toolbar switches:

- the screen
- room size: 3, 10, 30 or 60
- your role: host/guest or performer/guesser
- the mode
- voice states such as a blocked mic
- results outcomes, including "everyone guessed" and a tie

## Free vs. paid

Local development is free. Every dependency is open source and everything runs on your own machine.

Costs only appear when you host the game publicly for players on other networks:

- **A server** for the game server and LiveKit. LiveKit needs open UDP ports and bandwidth, which usually means a VPS.
- **Bandwidth and TURN relay traffic.** Players behind strict firewalls or mobile carriers have their audio relayed, which uses server bandwidth.
- **LiveKit Cloud (optional).** Instead of self-hosting, you can use LiveKit's hosted service, which has a free tier and paid plans beyond it. Self-hosting LiveKit is free apart from the server.
- **A domain name.** HTTPS is required for microphone access outside `localhost`. Let's Encrypt certificates are free; domains usually are not.

Cloudflare quick tunnels (above) are free for testing. Milestone 9 will cover public deployment step by step. The project does not use any paid APIs.
