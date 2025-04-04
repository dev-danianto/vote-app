import React from "react";
import ImageSlider from "../Components/ImageSlider";
import VideoComponent from "../Components/VideoPlayer";
import Cards from "../Components/Cards";
import Footer from "../Components/Footer";

const HomePage = ({ language }) => {
  return (
    <div
      className="homepage-container"
      style={{
        fontFamily: "Gotham Medium, sans-serif",
      }}
    >
      <ImageSlider language={language} />
      <VideoComponent />
      <Cards />
      <Footer language={language} />
    </div>
  );
};

export default HomePage;
