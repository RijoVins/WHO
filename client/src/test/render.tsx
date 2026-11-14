import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { GameMode } from '@ib/shared';
import { ModeProvider } from '../context/ModeProvider';

/** Render inside a router and the mode provider, optionally at a URL and with a pre-picked mode. */
export function renderWithRouter(ui: ReactNode, url = '/', mode: GameMode | null = null) {
  return render(
    <ModeProvider initial={mode}>
      <MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>
    </ModeProvider>,
  );
}
