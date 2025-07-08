"use client";
import React from "react";
import InputPrompt from "@/app/components/Model Steering Visualization/InputPrompt";
import TreeView from "@/app/components/Model Steering Visualization/TreeView";
import {SteerOutput} from "@/types/types";
import {useAppSelector} from "@/redux/hooks";

export default function ModelSteerVisualization() {
  const [strengths, setStrengths] = React.useState<number[]>([0]);
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SteerOutput[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<number | null>(null);
  const selectedFeature = useAppSelector((state) => state.feature.selectedFeature);
  const currentLLM = useAppSelector(state => state.query.currentLLM);
  Math.max(strengths.length * 100, 400);
  const handleSteer = async () => {
    if (!prompt || !selectedFeature) {
      console.error('Prompt or selected feature is missing');
      return;
    }
    setLoading(true);
    try {
      const requestBody = {
        feature_id: selectedFeature?.data.feature_info.feature_id,
        sae_id: selectedFeature?.data.feature_info.sae_id,
        prompt: prompt,
        feature_strengths: strengths,
        llm: currentLLM
      };
      console.log(requestBody)
      const response = await fetch('http://localhost:6006/api/feature/steer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      console.log(response)
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log(data)

      setResults(data.data.outputs);

    } catch (error) {
      console.error('Error during steering:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white shadow-md rounded-lg flex flex-col p-4">
      <div className="w-full h-[25%]">
        <InputPrompt prompt={prompt} setPrompt={setPrompt} handleSteer={handleSteer} loading={loading}/>
      </div>
      <div className="w-full h-[75%] overflow-auto">
        <TreeView strengths={strengths}
                  setStrengthsAction={setStrengths}
                  prompt={prompt}
                  results={results}
                  setResultsAction={setResults}
                  selectedBranch={selectedBranch}
                  setSelectedBranchAction={setSelectedBranch}/>
      </div>
    </div>
  );
}
