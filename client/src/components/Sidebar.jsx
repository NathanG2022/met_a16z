import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/supabase';
import logoIcon from '../assets/note.svg';
import settingsIcon from '../assets/settings.svg';
import chevronLeft from '../assets/chevron_left.svg';
import chevronRight from '../assets/chevron_right.svg';
import homeIcon from '../assets/home.svg';
import cardIcon from '../assets/card.png';

export default function Sidebar({ videos = 0, minutes = 0, notes = [], onWidthChange }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [clickedItem, setClickedItem] = useState(null);
  const [showText, setShowText] = useState(true);
  const location = useLocation();
  const { user } = useAuth();

  // Notify parent of initial width
  useEffect(() => {
    if (onWidthChange && window.innerWidth >= 768) {
      onWidthChange(collapsed ? 80 : 288);
    }
  }, [onWidthChange, collapsed]);
  
  // Navigation links
  const navLinks = [
    { to: '/', label: 'Dashboard', icon: homeIcon, alt: 'Dashboard' },
    { to: '/subscriptions', label: 'Subscriptions', icon: cardIcon, alt: 'Subscriptions' },
    { to: '/settings', label: 'Settings', icon: settingsIcon, alt: 'Settings' },
  ];
  
  // Calculate storage used in GB
  const totalMB = notes.reduce((sum, note) => sum + (Number(note.size) || 0), 0);
  const totalGB = totalMB / 1024;
  const storageLimitGB = 5;
  const storagePercent = Math.min(100, Math.round((totalGB / storageLimitGB) * 100));
  
  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <span className="material-icons text-2xl text-gray-700">menu</span>
      </button>
      
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 ${collapsed ? 'w-20' : 'w-72'} min-h-screen h-full bg-white border-r border-gray-200 shadow-2xl flex flex-col z-50 transition-all duration-500 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 overflow-hidden`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex flex-col flex-1 h-full">
          {/* Collapse/Expand button and logo */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'px-0' : 'px-4'} pt-8 pb-4 transition-all duration-300 ease-in-out`}> 
            <div className="flex items-center gap-2">
              {!collapsed && <img src={logoIcon} alt="Logo" className="w-10 h-10 transition-all duration-300 ease-in-out object-contain" />}
              {!collapsed && <span className="text-2xl font-extrabold text-gray-900 tracking-tight transition-all duration-300 ease-in-out">Noteus </span>}
            </div>
            <button
              className={`bg-white rounded-full p-1 shadow border border-gray-200 ${collapsed ? '' : 'ml-2'} transition-all duration-300 ease-in-out hover:bg-gray-50 hover:shadow-md`}
              onClick={() => {
                if (collapsed) {
                  // When expanding, delay the text appearance
                  setShowText(false);
                  setTimeout(() => setShowText(true), 200);
                } else {
                  // When collapsing, hide text immediately
                  setShowText(false);
                }
                const newCollapsed = !collapsed;
                setCollapsed(newCollapsed);
                // Notify parent of width change (only on desktop)
                if (onWidthChange && window.innerWidth >= 768) {
                  onWidthChange(newCollapsed ? 80 : 288); // 20 * 4 = 80px, 72 * 4 = 288px
                }
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <img src={collapsed ? chevronRight : chevronLeft} alt={collapsed ? 'Expand' : 'Collapse'} className="w-6 h-6 transition-transform duration-300 ease-in-out object-contain" />
            </button>
            {/* Close button for mobile */}
            <button
              className="ml-auto md:hidden bg-white rounded-full p-1 shadow border border-gray-200 transition-all duration-300 ease-in-out hover:bg-gray-50 hover:shadow-md"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <span className="material-icons text-xl text-gray-700">close</span>
            </button>
          </div>
          
          {/* Nav */}
          <nav className="mt-2 mb-8 flex-1">
            <ul className="space-y-1">
              {navLinks.map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-lg font-semibold text-lg transition-all duration-300 ease-in-out group relative ${
                      location.pathname === link.to
                        ? 'bg-black text-white font-semibold border-l-4 border-black shadow-lg transform scale-[1.02]'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:transform hover:scale-[1.02]'
                    } ${location.pathname === link.to ? 'hover:bg-black hover:text-white' : ''} ${
                      clickedItem === link.to ? 'transform scale-95' : ''
                    }`}
                    onClick={() => {
                      setOpen(false);
                      setClickedItem(link.to);
                      setTimeout(() => setClickedItem(null), 150);
                    }}
                  >
                    {/* Left border highlight for active */}
                    {location.pathname === link.to && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-black rounded-full transition-all duration-300 ease-in-out" />
                    )}
                    <img 
                      src={link.icon} 
                      alt={link.alt} 
                      className={`w-7 h-7 transition-all duration-300 ease-in-out flex-shrink-0 object-contain ${
                        location.pathname === link.to ? 'invert brightness-0' : ''
                      }`}
                    />
                    {!collapsed && showText && <span className="font-semibold text-lg leading-none transition-all duration-300 ease-in-out">{link.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Divider */}
          <div className={`mx-4 border-t border-gray-200 my-6 transition-all duration-300 ease-in-out ${collapsed ? 'w-10 mx-auto' : ''}`} />
        </div>
        
        {/* Bottom section: sticky at bottom */}
        <div className="absolute bottom-0 left-0 w-full pb-6">
          <div className={`${collapsed ? 'px-0 flex flex-col items-center' : 'px-4'} transition-all duration-300 ease-in-out`}>
            <div className={`flex items-center mb-3 w-full ${collapsed ? 'justify-center' : 'justify-start'} transition-all duration-300 ease-in-out`}>
              <div className={`w-10 h-10 bg-gray-900 text-white flex items-center justify-center rounded-full font-bold text-lg transition-all duration-300 ease-in-out`}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="ml-3 text-base font-semibold text-gray-900 transition-all duration-300 ease-in-out">
                  {user?.email || 'User'}
                </div>
              )}
            </div>
            {!collapsed && (
              <>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2 transition-all duration-300 ease-in-out">
                  <span>Premium</span>
                  <button 
                    onClick={signOut}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 transition-all duration-300 ease-in-out" aria-label={`Storage used: ${storagePercent}%`} title={`Storage used: ${storagePercent}%`}>
                  <div className="bg-gray-900 h-2 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${storagePercent}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 mt-2 transition-all duration-300 ease-in-out">{totalGB.toFixed(2)} GB / 5 GB</div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
} 