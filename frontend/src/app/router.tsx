import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { PlayersPage } from '@/features/players/pages/players-page';
import { ClubsPage } from '@/features/clubs/pages/clubs-page';
import { ClubDetailPage } from '@/features/clubs/pages/club-detail-page';
import { MatchesPage } from '@/features/league/pages/matches-page';
import { StandingsPage } from '@/features/league/pages/standings-page';
import { NotFoundPage } from '@/components/feedback/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/players" replace />,
      },
      {
        path: 'players',
        element: <PlayersPage />,
      },
      {
        path: 'clubs',
        element: <ClubsPage />,
      },
      {
        path: 'clubs/:id',
        element: <ClubDetailPage />,
      },
      {
        path: 'matches',
        element: <MatchesPage />,
      },
      {
        path: 'standings',
        element: <StandingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
