import React, { useEffect, useRef, useState } from "react";

const VideoWithInViewCurtain = () => {
  const [curtainOpen, setCurtainOpen] = useState(false);
  const videoContainerRef = useRef(null);

  // Intersection Observer to open the curtain when video container appears on screen
  useEffect(() => {
    const observerOptions = {
      threshold: 0.5, // Trigger when 50% of the container is visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        // Only trigger open if not already open
        if (entry.isIntersecting && !curtainOpen) {
          setCurtainOpen(true);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current);
    }

    return () => {
      if (videoContainerRef.current) {
        observer.unobserve(videoContainerRef.current);
      }
    };
  }, [curtainOpen]);

  // Scroll listener to close the curtain only when the user scrolls to the top
  useEffect(() => {
    const handleScroll = () => {
      // Adjust threshold as needed; here if user scrolls within 10px from the top, the curtain will close.
      if (window.scrollY < 10 && curtainOpen) {
        setCurtainOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [curtainOpen]);

  return (
    <>
      <div className="text-center p-5 text-2xl">
        "Sejalan dengan visi menjadi lembaga negara kelas dunia <br></br>yang
        peduli terhadap demokrasi, KPU terus melakukan inovasi <br></br>dalam
        pengamanan suara, anti-hoax act, dan proyek digitalisasi Indonesia."
      </div>
      <div className="w-full h-screen bg-white flex justify-center items-center">
        <div ref={videoContainerRef} className="relative w-11/12 max-w-6xl">
          {/* Video element */}
          <video
            className="w-full transition-transform duration-700 ease-in-out z-10"
            src="https://cpzhalbbnvwmmevzzacy.supabase.co/storage/v1/object/sign/video/pemilu.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ2aWRlby9wZW1pbHUubXA0IiwiaWF0IjoxNzQyNjU2MzEyLCJleHAiOjE5MDAzMzYzMTJ9.rHvSrQ7ZwfyZegLNLAJdZ1Gr47Ba5yDV_vxmuISyRkE" // Replace with your video URL
            autoPlay
            muted
            loop
          />

          {/* Left Curtain Overlay */}
          <div
            className={`absolute top-0 left-0 h-full w-1/2 bg-white transition-transform duration-1000 ease-in-out ${
              curtainOpen ? "-translate-x-full" : "translate-x-0"
            }`}
          />

          {/* Right Curtain Overlay */}
          <div
            className={`absolute top-0 right-0 h-full w-1/2 bg-white transition-transform duration-1000 ease-in-out ${
              curtainOpen ? "translate-x-full" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </>
  );
};

export default VideoWithInViewCurtain;
