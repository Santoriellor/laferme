import farmImage from '../images/farm-in-tuscany.jpg';
import bikeImage from '../images/bike-tour-tuscany.jpg';
import horseImage from '../images/horse-riding-tuscany.jpg';

// The slides the showcase carousel cycles through.
//
// `altKey` names a key in src/assets/locales/<lang>.json rather than holding
// the text itself, so the alternative text is translated along with the rest of
// the site. Before this module existed the alt text was the string "Image 1",
// hard-coded in English inside the component.
export const carouselSlides = [
  { src: farmImage, altKey: 'carouselAltFarm' },
  { src: bikeImage, altKey: 'carouselAltBike' },
  { src: horseImage, altKey: 'carouselAltHorse' },
];
