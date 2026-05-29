import React from 'react';

const StatCard = ({ title, value, color = 'bg-brand', icon, subtitle }) => {
  return (
    <div className="stat-card">
      <div className={`${color} p-3 rounded-lg text-white shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-black truncate">{title}</p>
        <p className="text-2xl font-bold text-black">{value}</p>
        {subtitle &&        <p className="text-xs text-black mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
