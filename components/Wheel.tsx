import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { Participant } from '../types';

interface WheelProps {
  participants: Participant[];
  rotation: number;
  size?: number;
}

const Wheel: React.FC<WheelProps> = ({ participants, rotation, size = 500 }) => {
  const radius = size / 2;
  const outerRadius = radius - 10;
  const innerRadius = 20;
  const count = participants.length;

  // Visual thresholds
  const showLabels = count <= 60;
  const showBorders = count <= 200;
  
  // Generate pie slices
  const pie = d3.pie<Participant>()
    .sort(null)
    .value(() => 1); // Equal size slices

  const arcs = useMemo(() => pie(participants), [participants]);

  const arcGenerator = d3.arc<d3.PieArcDatum<Participant>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  // Calculate text transformation
  const getTextTransform = (d: d3.PieArcDatum<Participant>) => {
    const centroid = arcGenerator.centroid(d);
    const angle = (d.startAngle + d.endAngle) / 2 * 180 / Math.PI - 90;
    
    // Push text outwards slightly for better readability
    const x = centroid[0] * 1.05; 
    const y = centroid[1] * 1.05;
    
    return `translate(${x}, ${y}) rotate(${angle})`;
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer/Needle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 pointer-events-none filter drop-shadow-lg">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21L5 9C5 9 5 3 12 3C19 3 19 9 19 9L12 21Z" fill="#F43F5E" stroke="#881337" strokeWidth="2"/>
          <circle cx="12" cy="8" r="3" fill="#FFF" />
        </svg>
      </div>

      {/* The Wheel SVG */}
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="filter drop-shadow-2xl"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0s linear', // handled by JS loop for smoothness
        }}
      >
        <g transform={`translate(${radius},${radius})`}>
          {/* Outer Border Ring */}
          <circle r={outerRadius + 5} fill="#1e293b" stroke="#334155" strokeWidth="10" />

          {arcs.map((arc, i) => (
            <g key={participants[i].id}>
              <path
                d={arcGenerator(arc) || undefined}
                fill={participants[i].color}
                stroke={showBorders ? "#0f172a" : "none"}
                strokeWidth={count > 50 ? "1" : "2"}
                className="transition-opacity duration-300"
              />
              {showLabels && (
                <text
                  transform={getTextTransform(arc)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  className="text-sm font-bold select-none pointer-events-none"
                  style={{ 
                    fontSize: count > 20 ? '10px' : count > 12 ? '12px' : '16px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {participants[i].name.length > 15 
                    ? participants[i].name.substring(0, 15) + '...' 
                    : participants[i].name}
                </text>
              )}
            </g>
          ))}
          
          {/* Center Hub */}
          <circle r={innerRadius + 10} fill="#1e293b" stroke="#475569" strokeWidth="4" />
          <circle r={innerRadius} fill="#fbbf24" />
          <text 
            textAnchor="middle" 
            dominantBaseline="middle" 
            fill="#78350f" 
            fontWeight="bold"
            fontSize="10"
          >
            ★
          </text>
        </g>
      </svg>
    </div>
  );
};

export default Wheel;