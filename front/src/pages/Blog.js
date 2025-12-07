import React, { useState, useRef, useEffect, useContext } from 'react';
import './Blog.css';

import { LanguageContext } from '../context/LanguageContext';

const Blog = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [newsData, setNewsData] = useState([]);

  const { language, texts } = useContext(LanguageContext);

  useEffect(() => {
    import(`../assets/news/news_${language}.json`)
      .then((data) => setNewsData(data.news))
      .catch((error) => console.error("Error loading news data:", error));
  }, [language]);
  
  useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true); // Trigger animation
          }
        },
        { threshold: 0.3 } // Trigger when 20% of the section is visible
      );
  
      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }
  
      return () => observer.disconnect(); // Cleanup
    }, []);

  return (
    <section id="blog" ref={sectionRef}>
      <h2 className={`blog-title ${isVisible ? 'active' : ''}`}>{texts.blogTitle}</h2>
      <div className="blog-container">
        {newsData.map((post) => (
          <div key={post.id} className="blog-card" onClick={() => setSelectedPost(post)}>
          <img src={post.image} alt={post.title} className="blog-image" />
          <div className="blog-info">
            <h3>{post.title}</h3>
            <p><i>{post.date}</i></p>
            <p className="blog-preview">{post.content.slice(0, 100)}...</p>
          </div>
        </div>
        ))}
      </div>

      {selectedPost && (
        <div className="modal" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedPost(null)}>✖</button>
            <div className="modal-body">
              <img src={selectedPost.image} alt={selectedPost.title} />
              <div className="modal-info">
                <h3>{selectedPost.title}</h3>
                <p><i>{selectedPost.date}</i></p>
                <p>{selectedPost.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Blog;