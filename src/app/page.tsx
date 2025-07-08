"use client";
import ConceptQuery from "@/app/components/Concept Query";
import VisualizationDashboard from "@/app/components/VisualizationDashboard";
import SectionC from "@/app/components/FeatureScatter/SectionC";
import ModelSteerVisualization from "@/app/components/Model Steering Visualization";
import FeatureExplorationDashboard from "./components/Feature Exploration Dashboard";
import SectionD1 from "./components/SectionD1";

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col gap-1 overflow-hidden">
      <div className="h-16 bg-[#1976d2] flex items-center px-4 shadow-md">
        <h1
          className="text-4xl font-normal text-white tracking-wider font-bold pl-4"
          style={{ fontFamily: "Limelight" }}
        >
          ConceptViz
        </h1>
      </div>
      <div className="flex flex-1 gap-1 overflow-hidden">
        <div className="h-full flex flex-col flex-1 md:flex-[2] gap-1 overflow-hidden">
          <div className="flex-[3.5] overflow-auto">
            <ConceptQuery />
          </div>
          <div className="flex-[9] overflow-auto">
            <VisualizationDashboard />
          </div>
        </div>

        <div className="flex flex-col flex-1 md:flex-[5] gap-1 overflow-hidden h-full">
          <div className="flex-[7] overflow-auto">
            <SectionC />
          </div>
          <div className="flex-[5] overflow-auto">
            <FeatureExplorationDashboard />
          </div>
        </div>

        <div className="flex flex-col flex-1 md:flex-[2] gap-1 overflow-hidden h-full">
          <div className="flex-[6] overflow-auto">
            <SectionD1 />
          </div>
          <div className="flex-[6] overflow-auto">
            <ModelSteerVisualization />
          </div>
        </div>
      </div>
    </div>
  );
}
