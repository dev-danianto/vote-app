import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";

const DesktopNavbar = ({
  language,
  toggleLanguage,
  hasScrolled,
  setMobileMenuOpen,
}) => {
  const [activeButton, setActiveButton] = useState(null);
  const [hoveredAuth, setHoveredAuth] = useState(null);
  const timeoutRef = useRef(null);

  // Desktop menu hover handlers
  const handleMenuHover = (id) => {
    clearTimeout(timeoutRef.current);
    setActiveButton(id);
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveButton(null);
    }, 300);
  };

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

  // Auth dropdown data
  const authDropdown = {
    login:
      language === "id"
        ? [
            { label: "Masuk", link: "/login" },
            { label: "Lupa Password", link: "/forgot-password" },
            { label: "Masuk dengan Google", link: "/login/google" },
            { label: "Masuk dengan Facebook", link: "/login/facebook" },
          ]
        : [
            { label: "Sign In", link: "/login" },
            { label: "Forgot Password", link: "/forgot-password" },
            { label: "Login with Google", link: "/login/google" },
            { label: "Login with Facebook", link: "/login/facebook" },
          ],
    register:
      language === "id"
        ? [
            { label: "Daftar", link: "/register" },
            { label: "Daftar Developer", link: "/register/developer" },
            { label: "Daftar Bisnis", link: "/register/business" },
            { label: "Verifikasi Email", link: "/verify-email" },
          ]
        : [
            { label: "Create Account", link: "/register" },
            { label: "Developer Account", link: "/register/developer" },
            { label: "Business Account", link: "/register/business" },
            { label: "Email Verification", link: "/verify-email" },
          ],
  };

  // Dynamic styles
  const getTextColor = () => (hasScrolled ? "text-gray-800" : "text-white");
  const getBorderColor = () =>
    hasScrolled
      ? "border-gray-800 text-gray-800 hover:border-gray-600"
      : "border-white text-white hover:border-blue-200";

  return (
    <div className="w-full px-4 flex items-center justify-between">
      {/* Logo & Title */}
      <div className="flex items-center gap-3 py-4">
        <img
          src="https://cpzhalbbnvwmmevzzacy.supabase.co/storage/v1/object/sign/logo/Logo%20KPU.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJsb2dvL0xvZ28gS1BVLnBuZyIsImlhdCI6MTc0MjY1NjUyMywiZXhwIjoxOTAwMzM2NTIzfQ.fskGyWSikC3Tnvkly9qPZPngF8arJRtZ-HLj4cB81OI"
          alt="Logo KPU"
          className="h-12"
        />
        <span className={`font-bold text-xl ${getTextColor()}`}>
          Komisi Pemilihan Umum
        </span>
      </div>

      {/* Desktop Menu */}
      <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
        {buttons.map((button) => (
          <div
            key={button.id}
            className="relative"
            onMouseEnter={() => handleMenuHover(button.id)}
            onMouseLeave={handleMenuLeave}
          >
            <Link
              to={button.link}
              className={`flex items-center gap-1 font-semibold ${getTextColor()} hover:text-blue-600`}
            >
              {button.label}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>

            {activeButton === button.id && (
              <div
                className={`absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-4 min-w-[240px] space-y-2 animate-dropdown`}
                onMouseEnter={() => handleMenuHover(button.id)}
                onMouseLeave={handleMenuLeave}
              >
                {button.dropdown.map((item, index) => (
                  <Link
                    key={index}
                    to={`${button.link}/${index}`}
                    className="flex items-center px-4 py-3 text-gray-800 hover:bg-blue-50 rounded-lg"
                  >
                    <span className="flex-1">{item}</span>
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Auth Buttons */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="relative">
          <Link
            to="/register"
            onMouseEnter={() => setHoveredAuth("register")}
            onMouseLeave={() => setHoveredAuth(null)}
            className={`border font-semibold px-6 py-2 rounded-full hover:bg-white hover:text-blue-600 ${getBorderColor()}`}
          >
            {language === "id" ? "Daftar" : "Register"}
          </Link>
          {hoveredAuth === "register" && (
            <div
              className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-4 min-w-[240px] space-y-2 animate-dropdown"
              onMouseEnter={() => setHoveredAuth("register")}
              onMouseLeave={() => setHoveredAuth(null)}
            >
              {authDropdown.register.map((item, index) => (
                <Link
                  key={index}
                  to={item.link}
                  className="block px-4 py-3 text-gray-800 hover:bg-blue-50 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Link
            to="/login"
            onMouseEnter={() => setHoveredAuth("login")}
            onMouseLeave={() => setHoveredAuth(null)}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-700"
          >
            {language === "id" ? "Login" : "Login"}
          </Link>
          {hoveredAuth === "login" && (
            <div
              className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-4 min-w-[240px] space-y-2 animate-dropdown"
              onMouseEnter={() => setHoveredAuth("login")}
              onMouseLeave={() => setHoveredAuth(null)}
            >
              {authDropdown.login.map((item, index) => (
                <Link
                  key={index}
                  to={item.link}
                  className="block px-4 py-3 text-gray-800 hover:bg-blue-50 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleLanguage}
          className={`font-semibold hover:text-blue-600 ${getTextColor()}`}
        >
          {language === "id" ? "EN" : "ID"}
        </button>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden flex items-center">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`focus:outline-none ${getTextColor()} text-2xl`}
        >
          <FaBars />
        </button>
      </div>
    </div>
  );
};

export default DesktopNavbar;
