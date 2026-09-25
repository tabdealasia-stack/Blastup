import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex flex-col mb-4">
              <span className="text-xl font-bold tracking-tight text-gray-900">BLASTUP</span>
              <span className="text-[10px] font-bold text-indigo-600 tracking-widest uppercase mt-0.5">
                BY TABDEAL
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Professional B2B WhatsApp transactional notification and automation platform for developers and businesses.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/#features" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Features</Link></li>
              <li><Link href="/#how-it-works" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">How It Works</Link></li>
              <li><Link href="/#security" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Security</Link></li>
              <li><Link href="/#pricing" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Developers</h4>
            <ul className="space-y-3">
              <li><Link href="/#api" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">API Overview</Link></li>
              <li><Link href="/dashboard/integration" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Integration Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Login</Link></li>
              <li><Link href="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Client Portal</Link></li>
              <li><a href="mailto:contact@tabdeal.com" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Tabdeal. All rights reserved.
          </p>
          <div className="text-sm text-gray-500 flex space-x-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
