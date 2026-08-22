import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

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

async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('the team section', () => {
  it('renders every member of the English team file', async () => {
    await renderApp();
    ['Emma Carter', 'Liam Brooks', 'Sophia Reynolds', 'Noah Bennett'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('gives every portrait the person it shows as its alternative text', async () => {
    await renderApp();
    expect(screen.getByAltText('Emma Carter')).toHaveAttribute(
      'src',
      '/images/aboutus/user2.jpg',
    );
  });

  it('links each member to three social profiles', async () => {
    const { container } = await renderApp();
    const links = container.querySelectorAll('.social-links a');
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveAttribute('href', 'https://twitter.com/emmafarmlife');
  });
});

describe('the news section', () => {
  it('renders every item of the English news file', async () => {
    await renderApp();
    expect(screen.getByText('New Hiking Trails Open!')).toBeInTheDocument();
    expect(screen.getByText('Community Cleanup Success')).toBeInTheDocument();
    expect(screen.getByText('Last Winter Storm')).toBeInTheDocument();
  });

  it('opens a modal holding the full article when an item is chosen', async () => {
    await renderApp();

    fireEvent.click(screen.getByText('New Hiking Trails Open!'));

    // The title now appears twice: once on the card, once in the modal.
    expect(screen.getAllByText('New Hiking Trails Open!')).toHaveLength(2);
    expect(
      screen.getByText('Discover the new scenic hiking trails now open to the public...'),
    ).toBeInTheDocument();
  });

  it('closes the modal again', async () => {
    await renderApp();

    fireEvent.click(screen.getByText('Community Cleanup Success'));
    expect(screen.getAllByText('Community Cleanup Success')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '✖' }));
    expect(screen.getAllByText('Community Cleanup Success')).toHaveLength(1);
  });
});

describe('the testimonials section', () => {
  it('renders each testimonial four times — the list is doubled, then shown in two sliders', async () => {
    await renderApp();
    expect(screen.getAllByText('- Alice Smith, CEO of TechCorp')).toHaveLength(4);
    expect(screen.getAllByText('- Bob Johnson, Marketing Director')).toHaveLength(4);
  });

  it('requests the testimonials from the public folder', async () => {
    await renderApp();
    expect(global.fetch).toHaveBeenCalledWith('/testimonials/testimonials.json');
  });
});

describe('the showcase carousel', () => {
  it('renders three slides with exactly one active', async () => {
    const { container } = await renderApp();
    expect(container.querySelectorAll('.carousel-image')).toHaveLength(3);
    expect(container.querySelectorAll('.carousel-image-wrapper.active')).toHaveLength(1);
    expect(container.querySelectorAll('.indicator')).toHaveLength(3);
  });
});
