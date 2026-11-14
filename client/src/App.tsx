import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import type { RouteObject } from 'react-router';
import { HomePage } from './pages/HomePage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { createRoom, joinRoom } from './services/rooms';

const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/create', element: <CreateRoomPage createRoom={createRoom} /> },
  { path: '/join', element: <JoinRoomPage joinRoom={joinRoom} /> },
  // In-room pages (/room/:code) arrive with the Socket.IO client in Milestone 3:
  // which one shows is decided by the server's room phase, not by the URL.
  { path: '*', element: <NotFoundPage /> },
];

if (import.meta.env.DEV) {
  // Development-only screen gallery. Vite removes this branch from production builds.
  const GalleryPage = lazy(() => import('./dev/GalleryPage'));
  routes.unshift({
    path: '/dev/gallery',
    element: (
      <Suspense fallback={null}>
        <GalleryPage />
      </Suspense>
    ),
  });
}

const router = createBrowserRouter(routes);

export default function App() {
  return <RouterProvider router={router} />;
}
