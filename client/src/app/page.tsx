import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { ArrowRight, Server, ShieldCheck, Zap, Code, LayoutDashboard, Database, Webhook, Key, Lock, CheckCircle2, Building, ShoppingBag, Utensils, Plane } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TABDEAL BLASTUP | WhatsApp Transactional Notifications',
  description: 'A professional B2B WhatsApp transactional notification and automation platform. Secure, reliable API integration for developers and businesses.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 font-sans text-gray-900">
      {/* Schema Markup for SoftwareApplication / WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "TABDEAL BLASTUP",
            "applicationCategory": "BusinessApplication",
            "description": "Professional B2B WhatsApp transactional notification and automation platform.",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />

      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-gray-100 bg-gray-50/30">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
              Transactional WhatsApp notifications & business automation
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect your websites, applications, and backend systems to trigger approved notification templates through a centralized, reliable API platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all">
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="#features" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-all">
                Explore Platform
              </Link>
            </div>
            
            {/* Conceptual Dashboard Graphic */}
            <div className="mt-20 max-w-5xl mx-auto relative rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden hidden sm:block">
              <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
              </div>
              <div className="p-8 grid grid-cols-3 gap-6 text-left">
                <div className="col-span-1 border-r border-gray-100 pr-6 space-y-6">
                  <div className="h-6 w-32 bg-gray-100 rounded"></div>
                  <div className="h-4 w-full bg-gray-50 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-50 rounded"></div>
                  <div className="h-4 w-4/6 bg-gray-50 rounded"></div>
                </div>
                <div className="col-span-2 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-indigo-50/50 rounded-xl border border-indigo-100"></div>
                    <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
                    <div className="h-24 bg-gray-50 rounded-xl border border-gray-100"></div>
                  </div>
                  <div className="h-48 bg-gray-50 rounded-xl border border-gray-100 w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-16">
              A robust, asynchronous architecture designed for reliability and scale.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Server className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-sm">Your App</h4>
              </div>
              <div className="hidden md:flex justify-center text-gray-300"><ArrowRight className="w-6 h-6" /></div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 relative shadow-sm ring-1 ring-indigo-500/20">
                <Webhook className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-sm">Blastup API</h4>
              </div>
              <div className="hidden md:flex justify-center text-gray-300"><ArrowRight className="w-6 h-6" /></div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Database className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 text-sm">Queue & Log</h4>
              </div>
            </div>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
              <div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 mb-4">1</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h4>
                <p className="text-sm text-gray-500">Secure API-key based validation scoped specifically to your isolated tenant environment.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 mb-4">2</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Event Processing</h4>
                <p className="text-sm text-gray-500">Idempotent payload processing mapping events against authorized notification templates.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 mb-4">3</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Safe Dispatch</h4>
                <p className="text-sm text-gray-500">Durable outbox workers securely dispatch messages to the self-hosted WhatsApp engine.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-gray-50/50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Professional Platform Capabilities</h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                Built from the ground up for stability, observability, and tenant security.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'API Authentication', desc: 'Secure hashed API keys scoped individually per client.', icon: Key },
                { title: 'Template Validation', desc: 'Strictly enforce notification structures using master templates.', icon: ShieldCheck },
                { title: 'Idempotent Delivery', desc: 'Prevent duplicate notifications with native event deduplication.', icon: Zap },
                { title: 'Durable Outbox', desc: 'Background worker queues ensuring resilient message delivery.', icon: Database },
                { title: 'SafeMode Processing', desc: 'Circuit breakers prevent infinite retries and API exhaustion.', icon: Lock },
                { title: 'Centralized Admin', desc: 'Manage tenants, categories, and catalogs from a single view.', icon: LayoutDashboard },
              ].map((feat, i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <feat.icon className="w-6 h-6 text-indigo-600 mb-4" />
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES SECTION */}
        <section id="use-cases" className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4 text-center">Business Use Cases</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-16 text-center">
              Automate the exact notifications your business relies on.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <ShoppingBag className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-4">E-commerce</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Order confirmations</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Payment receipts</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Shipping updates</li>
                </ul>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Building className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-4">Clinics</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Appointments</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Patient follow-ups</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Medical reminders</li>
                </ul>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Utensils className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-4">Restaurants</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Table reservations</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Order updates</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Service confirmations</li>
                </ul>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Plane className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-4">Travel & Tours</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Booking confirmations</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Itinerary updates</li>
                  <li className="flex items-center"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2" /> Emergency alerts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* API / DEVELOPER SECTION */}
        <section id="api" className="py-24 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Code className="w-10 h-10 text-indigo-400 mb-6" />
                <h2 className="text-3xl font-bold tracking-tight mb-4">Integration-Ready API</h2>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Connect your existing CRM, ERP, or custom backend to our transactional endpoint. Submit structured events and let our Outbox processor handle the delivery.
                </p>
                <Link href="/dashboard/integration" className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                  View Integration Guide
                </Link>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl font-mono text-sm overflow-x-auto">
                <div className="flex space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <pre className="text-gray-300">
<span className="text-rose-400">POST</span> /api/notifications/event
<span className="text-gray-500">Host:</span> api.tabdealdigital.in
<span className="text-gray-500">Authorization:</span> Bearer YOUR_API_KEY
<span className="text-gray-500">Content-Type:</span> application/json

{`{
  "eventId": "ORDER_12345",
  "templateSlug": "order_confirmation",
  "recipient": "CUSTOMER_NUMBER",
  "variables": {
    "customerName": "John Doe",
    "orderTotal": "$49.99"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY & RELIABILITY */}
        <section id="security" className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Security & Reliability</h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Blastup enforces strict tenant isolation, server-side authorization, and hashed API-key storage. The architectural design guarantees idempotent event handling and durable processing to prevent data loss.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm font-medium text-gray-700">
              <div className="p-4 bg-gray-50 rounded-lg">Tenant Isolation</div>
              <div className="p-4 bg-gray-50 rounded-lg">Hashed API Keys</div>
              <div className="p-4 bg-gray-50 rounded-lg">Idempotent Events</div>
              <div className="p-4 bg-gray-50 rounded-lg">Operational Logging</div>
            </div>
          </div>
        </section>

        {/* PRICING / CONTACT */}
        <section id="pricing" className="py-24 bg-indigo-600 text-white text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight mb-6">Ready to scale your notifications?</h2>
            <p className="text-lg text-indigo-100 mb-10">
              Discuss integration architecture, pricing models, and how Blastup can automate your specific business workflows.
            </p>
            <a href="mailto:contact@tabdeal.com" className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-indigo-600 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors">
              Request a Demo
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">What is Blastup?</h3>
                <p className="text-gray-600">Blastup is a professional B2B transactional notification engine that allows businesses to trigger WhatsApp messages securely from their own applications.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Is this the official Meta WhatsApp Business API?</h3>
                <p className="text-gray-600">No. Blastup currently utilizes a self-hosted WhatsApp Web/Baileys-based architecture to provide cost-effective and robust transactional deliveries.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">How does integration work?</h3>
                <p className="text-gray-600">You generate an API key in the Client Portal and perform HTTP POST requests from your application containing your predefined payload. Blastup handles the delivery asynchronously.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Are notifications template based?</h3>
                <p className="text-gray-600">Yes. To maintain platform integrity and prevent spam, all events must map strictly to templates approved and assigned by Superadmin configuration.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
