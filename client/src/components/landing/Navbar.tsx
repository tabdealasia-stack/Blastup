'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-gray-900">BLASTUP</span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mt-0.5">
                BY TABDEAL
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</Link>
            <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
            <Link href="/#use-cases" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Use Cases</Link>
            <Link href="/#api" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">API</Link>
            <Link href="/#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
              Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-gray-600 hover:text-gray-900 rounded-md focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 shadow-lg absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50">How It Works</Link>
            <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50">Features</Link>
            <Link href="/#use-cases" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50">Use Cases</Link>
            <Link href="/#api" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50">API</Link>
            <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-900 rounded-md hover:bg-gray-50">FAQ</Link>
            
            <div className="pt-4 mt-2 border-t border-gray-100">
              <div className="flex flex-col space-y-3 px-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                  Login
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="w-full text-center px-4 py-2 text-base font-semibold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
