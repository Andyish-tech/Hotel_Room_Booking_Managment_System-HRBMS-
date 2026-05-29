import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand via-yellow-600 to-yellow-700 
                      items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-black/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="mb-8">
            <svg className="w-24 h-24 mx-auto text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zm-9 .7c0-1.1.9-2 2-2s2 .9 2 2h-4z"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-black mb-4">Golden Stay</h1>
          <p className="text-xl text-black/80 mb-6">Hotel &amp; Accommodation</p>
          <div className="w-24 h-1 bg-black mx-auto mb-6 rounded-full"></div>
          <p className="text-black/70 text-lg max-w-md mx-auto">
            Luxury Comfort, Exceptional Service — Your Home Away From Home in Huye District
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-black/60 text-sm">
            <span>✦ Room Booking</span>
            <span>✦ Easy Check-in</span>
            <span>✦ Secure Payments</span>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
