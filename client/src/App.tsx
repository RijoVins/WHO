import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, useNavigate } from 'react-router';
import type { RouteObject } from 'react-router';
import { ArcadeBackground } from './components/ArcadeBackground';
import { ModeProvider } from './context/ModeProvider';
import { GameProvider } from './context/GameProvider';
import { useGame } from './context/game';
import { HomePage } from './pages/HomePage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { RoomPage } from './pages/RoomPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Layout() {
  return (
    <GameProvider>
      <ModeProvider>
        <ArcadeBackground />
        <Outlet />
      </ModeProvider>
    </GameProvider>
  );
}

function CreateRoute() {
  const game = useGame();
  const navigate = useNavigate();
  return (
    <CreateRoomPage
      createRoom={async (name, mode) => {
        const r = await game.createRoom(name, mode);
        if (r.ok && r.code) navigate(`/room/${r.code}`, { state: { justCreated: true } });
        return r;
      }}
    />
  );
}

function JoinRoute() {
  const game = useGame();
  const navigate = useNavigate();
  return (
    <JoinRoomPage
      joinRoom={async (name, code) => {
        const r = await game.joinRoom(name, code);
        if (r.ok && r.code) navigate(`/room/${r.code}`);
        return r;
      }}
    />
  );
}

const children: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: 'create', element: <CreateRoute /> },
  { path: 'join', element: <JoinRoute /> },
  { path: 'room/:code', element: <RoomPage /> },
  { path: '*', element: <NotFoundPage /> },
];

if (import.meta.env.DEV) {
  // Development-only screen gallery. Vite removes this branch from production builds.
  const GalleryPage = lazy(() => import('./dev/GalleryPage'));
  children.unshift({
    path: 'dev/gallery',
    element: (
      <Suspense fallback={null}>
        <GalleryPage />
      </Suspense>
    ),
  });
}

const router = createBrowserRouter([{ path: '/', element: <Layout />, children }]);

export default function App() {
  return <RouterProvider router={router} />;
}
