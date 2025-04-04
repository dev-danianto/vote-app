import React, { useState, useEffect, useRef } from "react";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";

const Navbar = ({ language, toggleLanguage }) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Scroll handler with smooth background transition
  useEffect(() => {
    const handleScroll = () => {
      // Get scroll position - works with both window and smooth-scrollbar
      const scrollY =
        window.scrollY ||
        (window.Scrollbar &&
          window.Scrollbar.get(document.getElementById("scroll-container"))
            ?.scrollTop) ||
        0;

      if (scrollY > 10) {
        if (!hasScrolled) {
          setHasScrolled(true);
          if (navRef.current) {
            navRef.current.style.transition =
              "background-color 0.3s ease, box-shadow 0.3s ease";
          }
        }
      } else {
        if (hasScrolled) {
          setHasScrolled(false);
        }
      }
    };

    // Listen to scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });

    // For smooth-scrollbar events
    const scrollContainer = document.getElementById("scroll-container");
    if (scrollContainer && window.Scrollbar) {
      const scrollbar = window.Scrollbar.get(scrollContainer);
      if (scrollbar) {
        scrollbar.addListener(handleScroll);
      }
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (scrollContainer && window.Scrollbar) {
        const scrollbar = window.Scrollbar.get(scrollContainer);
        if (scrollbar) {
          scrollbar.removeListener(handleScroll);
        }
      }
    };
  }, [hasScrolled]);

  return (
    <nav ref={navRef} className={`fixed top-0 left-0 right-0 z-50 w-full `}>
      <DesktopNavbar
        language={language}
        toggleLanguage={toggleLanguage}
        hasScrolled={hasScrolled}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <MobileNavbar
        language={language}
        toggleLanguage={toggleLanguage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        hasScrolled={hasScrolled}
      />
    </nav>
  );
};

export default Navbar;
