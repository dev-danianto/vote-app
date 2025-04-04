import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

const MobileNavbar = ({
  language,
  toggleLanguage,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);

  // Navigation data
  const buttons = [
    {
      id: "beranda",
      label: language === "id" ? "Beranda" : "Home",
      link: "/beranda",
      dropdown:
        language === "id"
          ? ["Beranda Utama", "Berita Terkini", "Pengumuman"]
          : ["Main Home", "Latest News", "Announcements"],
    },
    {
      id: "profil",
      label: language === "id" ? "Profil KPU" : "KPU Profile",
      link: "/profil",
      dropdown:
        language === "id"
          ? ["Sejarah", "Visi & Misi", "Struktur Organisasi"]
          : ["History", "Vision & Mission", "Organization Structure"],
    },
    {
      id: "informasi",
      label: language === "id" ? "Informasi Publik" : "Public Info",
      link: "/informasi",
      dropdown:
        language === "id"
          ? ["Statistik", "Publikasi", "Laporan"]
          : ["Statistics", "Publications", "Reports"],
    },
    {
      id: "layanan",
      label: language === "id" ? "Layanan" : "Services",
      link: "/layanan",
      dropdown:
        language === "id"
          ? ["Pengaduan", "Konsultasi", "Pelayanan Online"]
          : ["Complaints", "Consultation", "Online Services"],
    },
    {
      id: "kontak",
      label: language === "id" ? "Kontak Kami" : "Contact Us",
      link: "/kontak",
      dropdown:
        language === "id"
          ? ["Kantor Pusat", "Cabang", "Media Sosial"]
          : ["Head Office", "Branches", "Social Media"],
    },
  ];

  if (!mobileMenuOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Semi-transparent overlay with modernist blur effect */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setMobileMenuOpen(false)}
      ></div>

      {/* Main panel with modernist design */}
      <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl animate-slide-in">
        {/* Close button with modernist circle */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute -left-12 top-4 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
        >
          <FaTimes size={20} className="text-gray-800" />
        </button>

        {/* Content container */}
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Header with modernist typography */}
          <div className="pb-4 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              {language === "id" ? "Navigasi" : "Navigation"}
            </h3>
          </div>

          {/* Main navigation items */}
          <nav className="space-y-2">
            {buttons.map((button) => (
              <div key={button.id} className="group">
                <Link
                  to={button.link}
                  onClick={() =>
                    setOpenMobileDropdown(
                      openMobileDropdown === button.id ? null : button.id
                    )
                  }
                  className="flex justify-between items-center py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-medium text-gray-900">
                    {button.label}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      openMobileDropdown === button.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Link>
                {openMobileDropdown === button.id && (
                  <div className="pl-4 mt-1 space-y-2 animate-fade-in">
                    {button.dropdown.map((item, index) => (
                      <Link
                        key={index}
                        to={`${button.link}/${index}`}
                        className="block py-2 px-2 -mx-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Account section with modernist divider */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <Link
              to="/register"
              className="block py-3 px-2 -mx-2 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {language === "id" ? "Daftar" : "Register"}
            </Link>
            <Link
              to="/login"
              className="block py-3 px-2 -mx-2 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {language === "id" ? "Login" : "Login"}
            </Link>
            <button
              onClick={toggleLanguage}
              className="w-full text-left py-3 px-2 -mx-2 rounded-lg text-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors"
            >
              {language === "id"
                ? "Switch to English"
                : "Ganti ke Bahasa Indonesia"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavbar;
