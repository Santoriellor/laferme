import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

// These tests assert corrected behaviour, not current behaviour. Every one of
// them fails before the fixes in this task, which is the point: a
// characterization test that pinned five <h1> elements would make the deploy
// gate defend them.

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

// This block is deliberately first in the file. React warns about an invalid
// DOM property once per property name for the whole module registry, and Jest
// resets that registry per file, not per test — so the warning is only
// observable on the file's first render. Moving this below another render
// would make the assertion pass whether or not the defect is there.
describe('React receives valid DOM props', () => {
  it('renders the fixed donate wrapper without a lower-case class prop', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = await renderApp();

    expect(container.querySelector('.fixed-donate-btn-wrapper')).not.toBeNull();
    const complaints = spy.mock.calls
      .map((args) => String(args[0]))
      .filter((message) => message.includes('Invalid DOM property'));
    expect(complaints).toEqual([]);
  });
});

describe('heading structure', () => {
  it('has exactly one level-one heading', async () => {
    await renderApp();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome to La Ferme');
  });

  it('titles every section with a level-two heading', async () => {
    await renderApp();
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(
      expect.arrayContaining([
        'Help Us Save La Ferme',
        'About Us',
        'Contact',
        'Latest News',
        'What People Say',
      ]),
    );
  });
});

describe('controls are real controls', () => {
  it('exposes the mobile menu toggle as a button that reports its state', async () => {
    window.innerWidth = 500;
    await renderApp();

    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  // The Phase B reviewer turned the toggle's <div> into a <button> and the
  // existing suite stayed green, because Navbar.test.js selects it by class and
  // a class matches either element. These are the assertions that cannot: a
  // <div onClick> has no role, no accessible name and no place in the tab
  // order, so it fails all three of them.
  //
  // jsdom does not implement the activation behaviour that turns Enter or Space
  // on a focused button into a click, so keyboard operation is asserted the two
  // ways jsdom can see it: the element is a native <button> — which is what
  // gives it that behaviour in a browser — and it is focusable, so a keyboard
  // visitor can reach it at all. The activation itself is then dispatched as a
  // click with `detail: 0`, which is how a browser reports a click that came
  // from the keyboard rather than from a pointer.
  it('lets a keyboard reach and operate the mobile menu toggle', async () => {
    window.innerWidth = 500;
    const { container } = await renderApp();

    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).not.toHaveAttribute('disabled');

    toggle.focus();
    expect(document.activeElement).toBe(toggle);

    fireEvent.click(toggle, { detail: 0 });
    expect(container.querySelector('.menu')).toHaveClass('open');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle, { detail: 0 });
    expect(container.querySelector('.menu')).not.toHaveClass('open');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('exposes each carousel indicator as a named button', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: 'Slide 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide 3' })).toBeInTheDocument();
  });

  it('exposes each news card as a button naming its article', async () => {
    await renderApp();
    expect(screen.getByRole('button', { name: /New Hiking Trails Open!/ })).toBeInTheDocument();
  });
});

// Navbar.js chooses one of six layouts from window.innerWidth. Every branch's
// lower bound was exclusive while the next branch's upper bound sat one pixel
// below it, so these five widths matched no branch at all and the navbar
// rendered nothing — no links and no hamburger either. 768 is the commonest
// tablet width there is.
describe('every window width gets a navigation', () => {
  const LAYOUTS = [
    { width: 1151, visible: ['Home', 'About Us', 'Contact', 'News', 'Gallery', 'Testimonials'] },
    { width: 1051, visible: ['Home', 'About Us', 'Contact', 'News', 'Gallery', 'More ▼'] },
    { width: 901, visible: ['Home', 'About Us', 'Contact', 'News', 'More ▼'] },
    { width: 768, visible: ['Home', 'About Us', 'Contact', 'More ▼'] },
    { width: 675, visible: ['Home', 'About Us', 'More ▼'] },
  ];

  LAYOUTS.forEach(({ width, visible }) => {
    it(`renders a menu at exactly ${width}px`, async () => {
      window.innerWidth = width;
      const { container } = await renderApp();

      expect(container.querySelector('.menu')).not.toBeNull();
      visible.forEach((name) => {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      });
    });
  });
});

describe('everything interactive has an accessible name', () => {
  it('names the language selector', async () => {
    await renderApp();
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
  });

  it('names every contact field', async () => {
    await renderApp();
    expect(screen.getByLabelText('Your Name')).toHaveAttribute('name', 'name');
    expect(screen.getByLabelText('Your Email')).toHaveAttribute('name', 'email');
    expect(screen.getByLabelText('Your Message')).toHaveAttribute('name', 'message');
  });

  it('names every social link', async () => {
    await renderApp();
    expect(screen.getByRole('link', { name: 'Emma Carter – Twitter' })).toHaveAttribute(
      'href',
      'https://twitter.com/emmafarmlife',
    );
    expect(screen.getByRole('link', { name: 'Emma Carter – LinkedIn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Emma Carter – Facebook' })).toBeInTheDocument();
  });

  it('describes each carousel image in the visitor’s language', async () => {
    await renderApp();
    expect(screen.getByAltText('The farmhouse and its grounds in Tuscany')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'fr' },
    });

    expect(await screen.findByAltText('La ferme et son domaine en Toscane')).toBeInTheDocument();
  });
});

describe('the article modal', () => {
  it('is announced as a dialog naming its article', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /New Hiking Trails Open!/ }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('New Hiking Trails Open!');
  });

  it('closes on Escape', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: /New Hiking Trails Open!/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
