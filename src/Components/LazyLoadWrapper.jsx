import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

const LazyLoadWrapper = ({ children }) => {
  const [rootElement, setRootElement] = useState(null);

  useEffect(() => {
    // Set the custom scroll container as the root once it's available.
    setRootElement(document.getElementById("scroll-container"));
  }, []);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
    root: rootElement, // Use the smooth-scrollbar container as the root.
  });

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-1000 ease-in-out transform ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      {children}
    </div>
  );
};

export default LazyLoadWrapper;
