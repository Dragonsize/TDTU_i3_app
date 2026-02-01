'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Marketplace() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [fetchingListings, setFetchingListings] = useState(true);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  // Fetch listings on mount
  React.useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setFetchingListings(true);
    try {
      const response = await fetch('/api/marketplace');
      const data = await response.json();
      if (data.success) {
        setListings(data.listings);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setFetchingListings(false);
    }
  };

  const handleAddProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/add-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Sample Product',
          description: 'This is a test product from the marketplace',
          price: 99.99,
          category: 'textbooks'
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        alert('✅ Success!\n\nListing created successfully!\n\nData: ' + JSON.stringify(data.data, null, 2));
        // Refresh listings after adding
        fetchListings();
      } else {
        alert('❌ Error!\n\nMessage: ' + data.message + '\n\nFull response: ' + JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Exception caught:', error);
      alert('❌ Request Failed!\n\nError: ' + error + '\n\nCheck console for details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`font-display bg-[#f7f6f8] dark:bg-[#050505] text-slate-900 dark:text-white transition-all duration-300 min-h-screen relative ${isExpanded ? 'md:pr-64' : 'md:pr-20'} pr-0`}
    >
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      <nav
        className={`fixed right-0 top-0 h-screen py-8 z-50 flex flex-col items-center justify-between border-l border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1025]/80 backdrop-blur-md shadow-2xl dark:shadow-none transition-all duration-300 ${isExpanded ? 'w-64' : 'w-0 md:w-20'} overflow-visible`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute top-1/2 -translate-y-1/2 -left-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform z-50 ${isExpanded ? '' : 'md:flex'}`}
        >
          <span className="material-symbols-outlined text-sm">{isExpanded ? 'chevron_right' : 'chevron_left'}</span>
        </button>

        <div
          className={`flex flex-col items-center justify-between w-full h-full overflow-hidden ${isExpanded ? 'opacity-100 w-64' : 'opacity-0 md:opacity-100 md:w-20'} transition-opacity duration-200`}
        >
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <div className="flex items-center gap-3 w-full justify-center">
              <div className="items-center justify-center">
                <img src="/avt.jpg" alt="ITZone" className="w-9 h-9 rounded-full object-cover" />
              </div>
              {isExpanded && (
                <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden animate-fade-in">
                  ITZone
                </h2>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-4">
            <NavItem icon="dashboard" label="Dashboard" isExpanded={isExpanded} href="/dashboard" />
            <NavItem icon="smart_toy" label="AI Chatbot" isExpanded={isExpanded} href="/chatbot" />
            <NavItem icon="calendar_month" label="Calendar" isExpanded={isExpanded} href="/calendar" />
            <NavItem icon="storefront" label="Marketplace" isExpanded={isExpanded} href="/marketplace" active />
            <NavItem icon="inventory_2" label="My Listings" isExpanded={isExpanded} href="/listings" />
            <NavItem icon="account_circle" label="Settings" isExpanded={isExpanded} href="/settings" />
          </div>

          <div className="flex flex-col items-center gap-6 w-full px-4" />
        </div>
      </nav>

      <main className="px-4 lg:px-40 py-12 relative">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black mb-2 tracking-tight text-slate-900 dark:text-white">
              Student <span className="text-gradient">Marketplace</span>
            </h1>
            <p className="text-slate-600 dark:text-white/60">
              Buy and sell with fellow students
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            disabled={loading}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            {loading ? 'Adding...' : 'Test Add'}
          </button>
        </div>

        {fetchingListings ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading listings...</p>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No listings yet</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Be the first to list an item! Click "Test Add" to create a sample listing.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing: any) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-primary/10 transition-all cursor-pointer group"
              >
                {/* Image placeholder */}
                <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/40">image</span>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-2xl font-black text-primary mb-2">
                    ${listing.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                    {listing.description}
                  </p>
                  
                  {/* Seller info */}
                  {listing.profiles && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                        {listing.profiles.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {listing.profiles.username}
                      </div>
                    </div>
                  )}
                  
                  {/* Category badge */}
                  {listing.category && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {listing.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, isExpanded, href, active }: { icon: string; label: string; isExpanded: boolean; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-xl transition-colors ${
        active 
          ? 'bg-primary/10 dark:bg-primary/20' 
          : 'hover:bg-slate-100 dark:hover:bg-white/10'
      } ${isExpanded ? 'w-full px-4 py-3 gap-3 justify-start' : 'justify-center w-10 h-10 mx-auto'}`}
    >
      <span className={`material-symbols-outlined transition-colors shrink-0 ${
        active 
          ? 'text-primary' 
          : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white'
      }`}>
        {icon}
      </span>
      {isExpanded ? (
        <span className={`font-medium whitespace-nowrap overflow-hidden animate-fade-in ${
          active 
            ? 'text-primary dark:text-primary' 
            : 'text-slate-600 dark:text-slate-300'
        }`}>{label}</span>
      ) : (
        <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </Link>
  );
}
