import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import type { RouteObject } from 'react-router';
import { ArcadeBackground } from './components/ArcadeBackground';
import { ModeProvider } from './context/ModeProvider';
import { HomePage } from './pages/HomePage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { createRoom, joinRoom } from './services/rooms';

function Layout() {
  return (
    <ModeProvider>
      <ArcadeBackground />
      <Outlet />
    </ModeProvider>
  );
}

const children: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: 'create', element: <CreateRoomPage createRoom={createRoom} /> },
  { path: 'join', element: <JoinRoomPage joinRoom={joinRoom} /> },
  // In-room screens (/room/:code) arrive with the game server: which one shows
  // is decided by the server's room phase, not by the URL.
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
