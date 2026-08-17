import { render } from '@testing-library/react';
import App from './App';

test('the app renders without crashing', () => {
  const { container } = render(<App />);
  expect(container).not.toBeEmptyDOMElement();
});
