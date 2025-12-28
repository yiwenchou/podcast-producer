
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-12 text-center border-b-2 border-[#8b5e3c] mb-12">
      <h1 className="text-5xl font-bold text-[#5d4037] mb-4 tracking-widest">
        時光留聲機
      </h1>
      <p className="text-[#8b5e3c] italic text-lg">
        —— 聽見歷史的迴響，掌握學測的脈動 ——
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <span className="px-3 py-1 bg-[#8b5e3c] text-[#fdf6e3] rounded-full text-sm">108課綱</span>
        <span className="px-3 py-1 bg-[#8b5e3c] text-[#fdf6e3] rounded-full text-sm">高中歷史</span>
        <span className="px-3 py-1 bg-[#8b5e3c] text-[#fdf6e3] rounded-full text-sm">AI Podcast</span>
      </div>
    </header>
  );
};

export default Header;
