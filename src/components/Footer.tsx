import React from "react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white p-4 text-center">
      <p>&copy; {new Date().getFullYear()} HookViewPro. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
