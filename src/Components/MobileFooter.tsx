import React from "react";
import { Link } from "react-router-dom";

const MobileFooter = () => {
  return (
    <div className="md:hidden text-start space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Tentang Kami</h3>
        <p className="text-sm leading-relaxed">
          Kami adalah penyedia layanan informasi dan solusi digital. Komitmen
          kami adalah menyediakan layanan terbaik untuk masyarakat.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Kontak</h3>
        <ul className="text-sm space-y-1">
          <li>Jl. Imam Bonjol No.29 Jakarta 10310</li>
          <li>Email: persuratan@kpu.go.id</li>
          <li>Telepon: (021) 31937223</li>
        </ul>
      </div>
    </div>
  );
};

export default MobileFooter;
