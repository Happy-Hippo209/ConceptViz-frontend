"use client";
import React from "react";
import {ModelData, OverviewMatrixProps} from "@/types/types";
import { CloudCog } from "lucide-react";

const OverviewMatrix: React.FC<OverviewMatrixProps> = ({modelData, visibleRange, calculateAverageRank,}) => {
  const type = "RES";

  const maxLayer = modelData.length > 0 ? Math.max(...modelData.map(model => model.layer)) : 25;
  const totalLayers = maxLayer + 1;

  const getValueColor = (model: ModelData | undefined) => {
    if (!model) return "rgb(255, 255, 255)";
    const avgRank = calculateAverageRank(model);

    const normalizedValue = (totalLayers - avgRank) / (totalLayers - 1);
  
    const enhancedValue = Math.pow(normalizedValue, 1.2);

    const y = normalizedValue >= 0.8 ? 0.8 + (normalizedValue - 0.8) * 1 : (normalizedValue >= 0.7 ? 0.1 + (normalizedValue - 0.7) * 7 : normalizedValue / 3);
    
    return interpolateColor('#e3f2fd', '#1976d1', y);
  };

  const interpolateColor = (colorA: any, colorB: any, value: number) => {
    const t = Math.max(0, Math.min(1, value));
    
    const parseColor = (color: any) => {
      if (typeof color === 'string') {
        if (color.startsWith('#')) {
          const hex = color.slice(1);
          if (hex.length === 3) {
            return {
              r: parseInt(hex[0] + hex[0], 16),
              g: parseInt(hex[1] + hex[1], 16),
              b: parseInt(hex[2] + hex[2], 16)
            };
          } else if (hex.length === 6) {
            return {
              r: parseInt(hex.slice(0, 2), 16),
              g: parseInt(hex.slice(2, 4), 16),
              b: parseInt(hex.slice(4, 6), 16)
            };
          }
        }
        
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3])
          };
        }
      }
      
      if (typeof color === 'object' && color.r !== undefined) {
        return color;
      }
      
      return { r: 0, g: 0, b: 0 };
    };
    
    const rgbA = parseColor(colorA);
    const rgbB = parseColor(colorB);
    
    const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * t);
    const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * t);
    const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * t);
    
    const toHex = (num: number) => {
      const hex = num.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between" style={{ marginTop: '-5%' }}>
      <div className="flex w-full h-[85%]">
        <div className="relative flex-1 h-full flex items-center">
          <div className="w-full h-full flex items-center">
            <div className="grid gap-[2px] w-full" style={{gridTemplateColumns: `repeat(${totalLayers}, 1fr)`, height: "50%"}}>
              {Array.from({length: totalLayers}).map((_, layerIdx) => {
                const model = modelData.find((m) => m.layer === layerIdx && m.type === type);
                return (
                  <div key={`${type}-${layerIdx}`}
                      className="border rounded transition-colors duration-300 shadow-sm h-full"
                      style={{
                        borderColor: "rgba(25, 118, 209, 0.15)",
                        backgroundColor: getValueColor(model),
                        borderRadius: "3px",
                        minWidth: "0.85rem"
                      }}/>
                );
              })}
            </div>
          </div>

          <div
            className="absolute top-[15%] pointer-events-none z-10 border-2 border-[#1976d1] rounded box-border shadow-[0_0_0_2px_rgba(25,118,209,0.2)] transition-all duration-300"
            style={{
              left: `${(visibleRange.start / totalLayers) * 100}%`,
              width: `${((visibleRange.end - visibleRange.start + 1) / totalLayers) * 100}%`,
              height: "70%",
              backgroundColor: 'rgba(25, 118, 209, 0.06)'
            }}
          />
        </div>
      </div>

      <div className="grid gap-[2px] w-full h-[15%] items-center mt-[-20%]" style={{gridTemplateColumns: `repeat(${totalLayers}, 1fr)`}}>
        {Array.from({length: totalLayers}).map((_, idx) => (
          <div key={idx}
              className="text-center text-[0.8rem] font-semibold text-gray-500 min-w-[0.85rem]">
            {idx}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewMatrix;