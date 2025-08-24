import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer footer-center p-4 bg-base-300 text-base-content">
      <aside>
        <p>Richard Rafer Guy - 222117056</p>
      </aside>
    </footer>
  );
}

export default Footer;