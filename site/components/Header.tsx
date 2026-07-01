import Link from 'next/link';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '/services' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Process', href: '/process' },
  { name: 'Reviews', href: '/reviews' },
  { name: 'Contact', href: '/contact' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary/90 backdrop-blur-lg shadow-lg">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-white text-2xl font-bold" aria-label="Apply Pannu Bro Logo">
          Apply Pannu Bro
        </Link>
        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-6 text-white">
          {navItems.map((item) => (
            <li key={item.name}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link href={item.href} className="hover:underline">
                  {item.name}
                </Link>
              </motion.div>
            </li>
          ))}
        </ul>
        {/* Action Buttons */}
        <div className="flex space-x-4">
          <a
            href="https://wa.me/8525041700"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md flex items-center"
            aria-label="WhatsApp Contact"
          >
            WhatsApp
          </a>
          <a href="tel:8525041700" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md">
            Call Now
          </a>
        </div>
      </nav>
    </header>
  );
}
