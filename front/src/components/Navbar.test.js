import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

const TESTIMONIALS = [
  {
    name: 'Alice Smith',
    role: 'CEO of TechCorp',
    message: 'This service has transformed our business workflow. Highly recommended!',
  },
];

const ORIGINAL_WIDTH = window.innerWidth;

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(TESTIMONIALS) }));
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  window.innerWidth = ORIGINAL_WIDTH;
});

async function renderApp() {
  const view = render(<App />);
  await screen.findByText('Emma Carter');
  await screen.findByText('New Hiking Trails Open!');
  await screen.findAllByText('- Alice Smith, CEO of TechCorp');
  return view;
}

describe('the navigation at the default 1024px viewport', () => {
  it('shows the four primary destinations and a More dropdown', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About Us' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'News' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More ▼' })).toBeInTheDocument();
  });

  it('keeps Gallery and Testimonials inside the dropdown until it is opened', async () => {
    await renderApp();
    expect(screen.queryByRole('button', { name: 'Gallery' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'More ▼' }));

    expect(screen.getByRole('button', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Testimonials' })).toBeInTheDocument();
  });

  it('scrolls smoothly to the section a menu item names', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'About Us' }));

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }));
  });
});

describe('the navigation on a narrow viewport', () => {
  beforeEach(() => {
    window.innerWidth = 500;
  });

  it('renders a toggle and keeps the menu closed until it is activated', async () => {
    const { container } = await renderApp();

    const toggle = container.querySelector('.toggle');
    expect(toggle).not.toBeNull();
    expect(container.querySelector('.menu')).not.toHaveClass('open');

    fireEvent.click(toggle);
    expect(container.querySelector('.menu')).toHaveClass('open');

    fireEvent.click(toggle);
    expect(container.querySelector('.menu')).not.toHaveClass('open');
  });

  it('closes the menu once a destination is chosen', async () => {
    const { container } = await renderApp();

    fireEvent.click(container.querySelector('.toggle'));
    expect(container.querySelector('.menu')).toHaveClass('open');

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(container.querySelector('.menu')).not.toHaveClass('open');
  });
});

describe('the navigation at a 1200px viewport', () => {
  beforeEach(() => {
    window.innerWidth = 1200;
  });

  it('shows all six destinations directly, with no dropdown', async () => {
    await renderApp();

    ['Home', 'About Us', 'Contact', 'News', 'Gallery', 'Testimonials'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'More ▼' })).toBeNull();
  });
});

describe('the navigation at a 1100px viewport', () => {
  beforeEach(() => {
    window.innerWidth = 1100;
  });

  it('shows five destinations and tucks Testimonials into the More dropdown', async () => {
    await renderApp();

    ['Home', 'About Us', 'Contact', 'News', 'Gallery'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Testimonials' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'More ▼' }));

    expect(screen.getByRole('button', { name: 'Testimonials' })).toBeInTheDocument();
  });
});

describe('the navigation at an 800px viewport', () => {
  beforeEach(() => {
    window.innerWidth = 800;
  });

  it('shows three destinations and tucks News, Gallery and Testimonials into the More dropdown', async () => {
    await renderApp();

    ['Home', 'About Us', 'Contact'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
    ['News', 'Gallery', 'Testimonials'].forEach((name) => {
      expect(screen.queryByRole('button', { name })).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'More ▼' }));

    ['News', 'Gallery', 'Testimonials'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
  });
});

describe('the navigation at a 700px viewport', () => {
  beforeEach(() => {
    window.innerWidth = 700;
  });

  it('shows two destinations and tucks Contact, News, Gallery and Testimonials into the More dropdown', async () => {
    await renderApp();

    ['Home', 'About Us'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
    ['Contact', 'News', 'Gallery', 'Testimonials'].forEach((name) => {
      expect(screen.queryByRole('button', { name })).toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: 'More ▼' }));

    ['Contact', 'News', 'Gallery', 'Testimonials'].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    });
  });
});

describe('language switching', () => {
  it('replaces the header, the menu and the team copy when French is chosen', async () => {
    await renderApp();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fr' } });

    expect(await screen.findByText('Bienvenue à la Ferme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeInTheDocument();
    expect(await screen.findByText('Propriétaire & Hôte')).toBeInTheDocument();
    expect(await screen.findByText('Nouveaux sentiers de randonnée ouverts !')).toBeInTheDocument();
  });

  it('replaces the header when German is chosen', async () => {
    await renderApp();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'de' } });

    expect(await screen.findByText('Wilkommen zur La Ferme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Startseite' })).toBeInTheDocument();
  });
});
