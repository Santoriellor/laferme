import { render, screen } from '@testing-library/react';
import App from './App';

// Characterization tests: these assert what the page renders today, so that the
// refactor can be shown not to have changed it. Where a test would otherwise
// pin a defect, it does not — the defect is fixed in Phase C against a test
// asserting the corrected behaviour instead.

// Testimonial.js calls fetch('/testimonials/testimonials.json') on mount. This
// jsdom exposes Node's global fetch, which would attempt a real request against
// a relative URL and reject asynchronously, so every test supplies a stub.
const TESTIMONIALS = [
  {
    name: 'Alice Smith',
    role: 'CEO of TechCorp',
    message: 'This service has transformed our business workflow. Highly recommended!',
  },
  {
    name: 'Bob Johnson',
    role: 'Marketing Director',
    message: 'An incredible experience from start to finish. Outstanding team!',
  },
];

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(TESTIMONIALS) }));
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Renders the app and waits until every asynchronous content load has settled:
 * AboutUs and Blog each resolve a dynamic import(), Testimonial resolves the
 * fetch stubbed above. Waiting for one item from each keeps those state updates
 * inside act() and makes the assertions deterministic.
 */
async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('the page shell', () => {
  it('renders the four document landmarks', async () => {
    await renderApp();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders every section the navigation scrolls to', async () => {
    const { container } = await renderApp();
    ['fundraiser', 'about-us', 'contact', 'blog', 'showcase', 'testimonials'].forEach((id) => {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    });
  });

  it('does not render the two sections whose markup is commented out', async () => {
    const { container } = await renderApp();
    expect(container.querySelector('#biking-tour')).toBeNull();
    expect(container.querySelector('#horse-riding')).toBeNull();
  });

  it('shows the English copy by default', async () => {
    await renderApp();
    expect(screen.getByText('Welcome to La Ferme')).toBeInTheDocument();
    expect(screen.getByText('Help Us Save La Ferme')).toBeInTheDocument();
    expect(screen.getByText(/Guesthouse La Ferme/)).toBeInTheDocument();
    expect(screen.getByText(/All Rights Reserved/)).toBeInTheDocument();
  });

  it('shows the fundraiser progress against its goal', async () => {
    await renderApp();
    const goal = screen.getByText(/raised of/);
    // Fundraiser.js:53 calls toLocaleString() with no locale, so the thousands
    // separator is whatever the host resolves — a comma on CI (en-US), an
    // apostrophe on a de-CH machine. \D? accepts any single separator, or none,
    // so this pins the rendered amounts rather than the machine's locale.
    expect(goal).toHaveTextContent(/\$1\D?500\b/);
    expect(goal).toHaveTextContent(/\$10\D?000\b/);
  });

  it('offers both donate buttons', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Donate Now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Donate' })).toBeInTheDocument();
  });
});
