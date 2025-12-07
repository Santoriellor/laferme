import React from 'react';

import Header from './components/Header';
import Footer from './components/Footer';
import Fundraiser from './pages/Fundraiser';
import Showcase from './pages/Showcase';
import AboutUs from './pages/AboutUs';
import Blog from './pages/Blog';
import BikingTour from './pages/BikingTour';
import HorseRiding from './pages/HorseRiding';
import Testimonials from './pages/Testimonial';
import Contact from './pages/Contact';

import './App.css';

import { LanguageProvider } from './context/LanguageContext';

const App = () => {

  return (
    <LanguageProvider>
    <div className='content'>
      <Header />
      <main className="main-container">
          <Fundraiser />
          <AboutUs />
          <Contact />
          <Blog />
          <Showcase />
          {/* <BikingTour /> */}
          {/* <HorseRiding /> */}
          <Testimonials />
      </main>
      <Footer />
    </div>
    </LanguageProvider>
  );
};

export default App;
