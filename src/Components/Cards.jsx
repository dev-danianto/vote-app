import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaRegFlag,
  FaShoppingCart,
  FaClipboardList,
  FaBullhorn,
  FaUserShield,
} from "react-icons/fa";

const ModernResponsiveCards = () => {
  // Card data
  const cards = [
    {
      title: "Sistem Pelaporan Kecurangan Pemilu",
      icon: <FaRegFlag className="w-10 h-10 text-red-600" />,
      rippleColor: "bg-red-600",
      link: "/sistem-pelaporan-kecurangan-pemilu",
    },
    {
      title: "E-Procurement",
      icon: <FaShoppingCart className="w-10 h-10 text-green-600" />,
      rippleColor: "bg-green-600",
      link: "/e-procurement",
    },
    {
      title: "Laporan Pemilu",
      icon: <FaClipboardList className="w-10 h-10 text-blue-600" />,
      rippleColor: "bg-blue-600",
      link: "/laporan-pemilu",
    },
    {
      title: "Siaran Pers",
      icon: <FaBullhorn className="w-10 h-10 text-yellow-600" />,
      rippleColor: "bg-yellow-600",
      link: "/siaran-pers",
    },
    {
      title: "Keamanan Data",
      icon: <FaUserShield className="w-10 h-10 text-purple-600" />,
      rippleColor: "bg-purple-600",
      link: "/security-breach",
    },
  ];

  // Sample news items for carousel – ensure you have at least 8 items.
  const newsItems = [
    {
      id: 1,
      title: "Pemilu 2024: Persiapan Intensif di Seluruh Daerah",
      thumbnail:
        "https://www.kpu.go.id/images/1726038954Simulasi%20Pemungutan%20dan%20Penghitungan%20Suara,%20Pastikan%20Pilkada%202024%20Berjalan%20Lancar.jpg",
      link: "/news/1",
    },
    {
      id: 2,
      title: "Inovasi Digital: Modernisasi Sistem Informasi Pemilu",
      thumbnail:
        "https://www.purbalinggakab.go.id/wp-content/uploads/2024/01/Pemilu-Makin-Dekat-278-Pemilih-Ikuti-Simulasi-Di-Kantor-KPU-Purbalingga-scaled.jpg",
      link: "/news/2",
    },
    {
      id: 3,
      title: "KPU Umumkan Kebijakan Baru untuk Pemilu Bersih",
      thumbnail:
        "https://pekalongankota.go.id/upload/berita/berita_20240131042924.jpeg",
      link: "/news/3",
    },
    {
      id: 4,
      title: "Wawancara Eksklusif: Direktur KPU Bicara Inovasi",
      thumbnail:
        "https://www.tangerangkota.go.id/files/berita/40517kpu-kota-tangerang-lakukan-simulasi-pemilihan-jelang-pemilu-2024-40517.jpeg",
      link: "/news/4",
    },
    {
      id: 5,
      title: "Pengumuman Resmi: Jadwal Pemilu Terbaru",
      thumbnail:
        "https://www.bekasikab.go.id/uploads/news/id10509_Compress_20240926_123514_4870.jpg",
      link: "/news/5",
    },
    {
      id: 6,
      title: "Teknologi Baru di Balik Layar Pemilu 2024",
      thumbnail:
        "https://cdn.antaranews.com/cache/1200x800/2024/09/21/1000364990.jpg",
      link: "/news/6",
    },
    {
      id: 7,
      title: "Pendekatan Digital untuk Pemilu yang Lebih Transparan",
      thumbnail:
        "https://ugm.ac.id/wp-content/uploads/2014/07/21071414059289081706390310.jpg",
      link: "/news/7",
    },
    {
      id: 8,
      title: "Masa Depan Demokrasi: Pemilu dan Inovasi",
      thumbnail:
        "https://dinkominfo.demakkab.go.id/asset/foto_berita/WhatsApp_Image_2024-01-17_at_14_00_56.jpeg",
      link: "/news/8",
    },
  ];

  // Duplicate news items for continuous effect if needed
  const duplicatedNews = [...newsItems, ...newsItems];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 space-y-8">
      {/* Cards Section */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((card, index) => (
            <Link key={index} to={card.link}>
              <div className="group relative flex flex-col items-center justify-center aspect-square bg-white rounded-xl shadow-md overflow-hidden">
                {/* Ripple effect */}
                <span
                  className={`absolute ${card.rippleColor} opacity-20 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out group-hover:w-[300px] group-hover:h-[300px] w-0 h-0`}
                  style={{ top: "50%", left: "50%" }}
                ></span>
                {/* Card content */}
                <div className="relative z-10 flex flex-col items-center">
                  {card.icon}
                  <h3 className="mt-2 text-center text-xs sm:text-sm font-semibold text-gray-800 px-2">
                    {card.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* News Header */}
      <h2 className="text-center text-3xl sm:text-4xl font-bold text-gray-800 underline decoration-blue-600 transition duration-600">
        Berita
      </h2>

      {/* Continuous News Carousel */}
      <div className="relative max-w-7xl mx-auto overflow-hidden">
        {/* CSS keyframes for marquee effect */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div
          className="flex"
          style={{
            animation: "marquee 30s linear infinite",
            width: "200%", // Full width equals two copies of the news list
          }}
        >
          {duplicatedNews.map((item, index) => (
            <div key={index} className="flex-none w-1/2 sm:w-[12.5%] px-1">
              <Link to={item.link}>
                <div className="overflow-hidden rounded-md shadow cursor-pointer">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-28 sm:h-40 object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="p-1 bg-white">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernResponsiveCards;
