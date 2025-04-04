import React from "react";
import DesktopFooter from "./DesktopFooter";
import MobileFooter from "./MobileFooter";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <DesktopFooter />
        <MobileFooter />
      </div>
      <div className="mt-12 border-t border-gray-700 pt-4 text-center text-sm">
        &copy; {new Date().getFullYear()} Komisi Pemilihan Umum. All rights
        reserved.
      </div>
    </footer>
  );
};

export default Footer;
