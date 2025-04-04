import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const DesktopFooter = () => {
  return (
    <div className="hidden md:grid grid-cols-4 gap-8">
      {/* About Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Tentang Kami</h3>
        <p className="text-sm leading-relaxed">
          Kami adalah penyedia layanan informasi dan solusi digital. Komitmen
          kami adalah menyediakan layanan terbaik untuk masyarakat.
        </p>
      </div>

      {/* Navigation Links */}
      <div>
        <h3 className="text-xl font-bold mb-4">Navigasi</h3>
        <ul className="space-y-2">
          <li>
            <Link to="/" className="hover:text-blue-400 transition-colors">
              Beranda
            </Link>
          </li>
          <li>
            <Link
              to="/services"
              className="hover:text-blue-400 transition-colors"
            >
              Layanan
            </Link>
          </li>
          <li>
            <Link to="/news" className="hover:text-blue-400 transition-colors">
              Berita
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className="hover:text-blue-400 transition-colors"
            >
              Hubungi Kami
            </Link>
          </li>
        </ul>
      </div>

      {/* Contact Info */}
      <div>
        <h3 className="text-xl font-bold mb-4">Kontak</h3>
        <ul className="space-y-2 text-sm">
          <li>Jl. Imam Bonjol No.29 Jakarta 10310</li>
          <li>Email: persuratan@kpu.go.id</li>
          <li>Telepon: (021) 31937223</li>
        </ul>
      </div>

      {/* Social Media */}
      <div>
        <h3 className="text-xl font-bold mb-4">Ikuti Kami</h3>
        <div className="flex space-x-4">
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-blue-600 transition-colors"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://www.twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-blue-400 transition-colors"
          >
            <FaTwitter />
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-pink-600 transition-colors"
          >
            <FaInstagram />
          </a>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full hover:bg-blue-700 transition-colors"
          >
            <FaLinkedinIn />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DesktopFooter;
