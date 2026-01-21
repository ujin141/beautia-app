import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-[24px] border border-line p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-6 text-brand-mint">
        {icon}
      </div>
      <h3 className="text-[18px] font-bold text-primary mb-3">{title}</h3>
      <p className="text-[15px] leading-[22px] text-secondary text-balance">
        {description}
      </p>
    </div>
  );
}
