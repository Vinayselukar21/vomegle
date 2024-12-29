import { Github } from "lucide-react";
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="flex gap-2 justify-center bg-transparent p-4 text-center text-muted-foreground">
      <p>Vomegle. Made with &lt;3 by Vinay</p>
      <p>
        <a
          href="https://github.com/Vinayselukar21/vomegle"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github />
        </a>
      </p>
    </footer>
  );
};

export default Footer;
