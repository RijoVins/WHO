import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/** Render inside a router, optionally at a given URL. */
export function renderWithRouter(ui: ReactNode, url = '/') {
  return render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>);
}
