import React, { useState, useEffect } from "react";

const slides = [
  {
    image:
      "https://cpzhalbbnvwmmevzzacy.supabase.co/storage/v1/object/sign/background/slide4.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kL3NsaWRlNC5wbmciLCJpYXQiOjE3NDIzMTUxNjksImV4cCI6MTg5OTk5NTE2OX0.NZE0gB4mEd7o_kNBAgduw_GByhOqGVb02i0YMyxRUxY",
    title: "Hadir Untuk Membantu",
    subtitle: "Pendapat Semua Orang",
  },
  {
    image:
      "https://cpzhalbbnvwmmevzzacy.supabase.co/storage/v1/object/sign/background/slide6.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kL3NsaWRlNi5wbmciLCJpYXQiOjE3NDIzMTU0MzIsImV4cCI6MTg5OTk5NTQzMn0.4-VcM3E_bFyBc-0-t1f5DtxSao9eb995aTCAoXrpmpU",
    title: "Semua Pendapat Itu",
    subtitle: "Berharga",
  },
  {
    image:
      "https://cpzhalbbnvwmmevzzacy.supabase.co/storage/v1/object/sign/background/slide2.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJiYWNrZ3JvdW5kL3NsaWRlMi5wbmciLCJpYXQiOjE3NDIzMTQ3OTMsImV4cCI6MTg5OTk5NDc5M30.TsYTJY_p5Ca7bqyZu90kXVl6PRMtR9cW9JzdF9iXkkM",
    title: "Pendapat Orang-Orang",
    subtitle: "Pasti Berbeda-Beda",
  },
];

const ImageSliderBackground = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger fade-out
      setFade(false);

      // Wait for fade-out to complete, then change slide and trigger fade-in
      setTimeout(() => {
        setCurrentSlideIndex((prevIndex) =>
          prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        );
        setFade(true); // Trigger fade-in
      }, 1000); // Match this duration with the fade-out animation duration
    }, 7000); // Change slide every 7 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      className="relative w-full h-screen bg-center transition-all duration-1000 ease-in-out"
      style={{
        backgroundImage: `url(${currentSlide.image})`,
      }}
    >
      {/* Text Overlay */}
      <div className="absolute inset-0 flex items-center justify-start">
        <div
          className={`text-start text-white bg-opacity-40 p-15 rounded-lg transition-opacity duration-1000 ease-in-out ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1 className="text-6xl font-bold">{currentSlide.title}</h1>
          {currentSlide.subtitle && (
            <p className="text-6xl font-bold">{currentSlide.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSliderBackground;
