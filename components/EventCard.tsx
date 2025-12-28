
import React from 'react';
import { HistoricalEvent } from '../types';

interface EventCardProps {
  event: HistoricalEvent;
  onSelect: (event: HistoricalEvent) => void;
  disabled: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onSelect, disabled }) => {
  return (
    <div 
      className={`
        relative group overflow-hidden rounded-lg shadow-xl cursor-pointer transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2 hover:shadow-2xl'}
        border-4 border-[#d2b48c] bg-[#fffaf0]
      `}
      onClick={() => !disabled && onSelect(event)}
    >
      <div className="h-48 w-full overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
        />
      </div>
      <div className="p-6">
        <div className="text-sm text-[#8b5e3c] font-bold mb-1">{event.period}</div>
        <h3 className="text-2xl font-bold text-[#5d4037] mb-3">{event.title}</h3>
        <p className="text-[#6d4c41] text-sm leading-relaxed mb-4 line-clamp-3">
          {event.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {event.keywords.map((kw, idx) => (
            <span key={idx} className="text-[10px] uppercase tracking-wider font-bold bg-[#e6ccb2] text-[#5d4037] px-2 py-1 rounded">
              #{kw}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#8b5e3c] pointer-events-none rounded-lg transition-colors"></div>
    </div>
  );
};

export default EventCard;
