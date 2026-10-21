import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { WelcomePage } from '@/features/home/welcome-page';
import { PlayersPage } from '@/features/players/pages/players-page';
import { ClubsPage } from '@/features/clubs/pages/clubs-page';
import { ClubDetailPage } from '@/features/clubs/pages/club-detail-page';
import { MatchesPage } from '@/features/league/pages/matches-page';
import { MatchDetailPage } from '@/features/league/pages/match-detail-page';
import { StandingsPage } from '@/features/league/pages/standings-page';
import { NotFoundPage } from '@/components/feedback/not-found-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WelcomePage />,
  },
  {
    element: <AppLayout />,
    children: [
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
        path: 'matches/:id',
        element: <MatchDetailPage />,
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
