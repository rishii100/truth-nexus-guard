
import { Shield, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Truth Nexus Guard</h1>
              <p className="text-xs text-gray-500">AI-Driven Deepfake Detection</p>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#detection" className="text-gray-700 hover:text-blue-600 font-medium">Detection</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">About</a>
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium">Features</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
          </nav>
          
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <a href="#detection" className="text-gray-700 hover:text-blue-600 font-medium">Detection</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium">About</a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium">Features</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
