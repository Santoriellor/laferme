// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom (react-scripts' default jest test environment) does not implement
// IntersectionObserver. Fundraiser, Contact, Blog and AboutUs all construct
// one in a useEffect to drive scroll-reveal animations, so without this
// stub their effects throw a ReferenceError and any render(<App />) fails.
// The stub is a no-op: the reveal callback simply never fires in tests,
// which is fine since App.test.js only asserts that something rendered.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserverStub;
