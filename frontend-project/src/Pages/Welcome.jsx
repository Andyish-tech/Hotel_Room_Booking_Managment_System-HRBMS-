import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden relative flex items-center justify-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-brand/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-brand rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zm-9 .7c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
            </svg>
          </div>
        </div>

        {/* Badge / Span */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand rounded-full text-black text-xs sm:text-sm font-medium mb-6 shadow-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Hotel Room Booking Management System
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black leading-tight mb-4">
          Welcome to
          <span className="block text-brand mt-2">
            Golden Stay
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-black/70 max-w-xl mx-auto mb-10 leading-relaxed">
          Manage your hotel operations with ease — room bookings, check-ins, 
          payments, and reports, all from one platform.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="group inline-flex items-center justify-center gap-2 bg-brand text-black font-bold px-8 py-3.5 rounded-xl text-base sm:text-lg shadow-lg hover:bg-brand/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign In to Dashboard
          </Link>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 bg-gray-100 text-black font-medium px-8 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-all duration-300 hover:-translate-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Recover Password
          </Link>
        </div>

        {/* Trust indicator */}
        <div className="mt-12 flex flex-wrap items-center gap-3 justify-center">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-gray-200 bg-brand/20 flex items-center justify-center text-black text-xs font-bold"
              >
                {['AK', 'JM', 'PL'][i - 1]}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-gray-200 bg-brand flex items-center justify-center text-black text-xs font-bold">
              +4
            </div>
          </div>
          <p className="text-black/60 text-sm">
            <span className="text-black font-semibold">Trusted</span> by staff in Huye District
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
