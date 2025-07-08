"use client";
import React from "react";
import {Paper, Typography} from "@mui/material";

import SelectMetricsDropdown from "@/app/components/VisualizationDashboard/Select Metrics Dropdown";
import {ModelData} from "@/types/types";
import {metricOptions} from "@/data/metricOptions";
import OverviewMatrix from "@/app/components/VisualizationDashboard/OverviewerMatrix";
import ModelTable from "@/app/components/VisualizationDashboard/Layer and Type Data Table";
import {useAppDispatch, useAppSelector} from "@/redux/hooks";
import {setSelectedAttrs, setSelectedModel, setVisibleRange} from "@/redux/features/modelSlice";

const VisualizationDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const {modelData, selectedModel, visibleRange, selectedAttrs} = useAppSelector((state) => state.model);
  
  // 检查是否能正确获取currentLLM，如果不能则提供fallback
  const currentLLM = useAppSelector(state => state.query?.currentLLM || state.llm?.selectedLLM);

const recalculateResRanks = (models: ModelData[]) => {
  // 使用selectedAttrs而不是硬编码的属性
  const targetAttrs = selectedAttrs.length > 0 ? selectedAttrs : ["top_10_score", "top_100_score", "top_1000_score"];
  const resModels = models.filter(model => model.type === "RES");
  
  // 创建一个新的Map来存储每个模型的排名
  const rankMap = new Map<string, { [key: string]: number }>();
  
  targetAttrs.forEach(attr => {
    // 按照value值降序排序
    const sortedModels = [...resModels].sort((a, b) => {
      const aValue = (a[attr] as { value: number })?.value ?? 0;
      const bValue = (b[attr] as { value: number })?.value ?? 0;
      return bValue - aValue;
    });

    // 处理相同值的排名逻辑
    let currentRank = 1;
    let previousValue: number | null = null;
    
    sortedModels.forEach((model, index) => {
      const currentValue = (model[attr] as { value: number })?.value ?? 0;
      
      // 如果当前值与前一个值不同，更新排名
      if (previousValue !== null && currentValue !== previousValue) {
        currentRank = index + 1;
      }
      
      if (!rankMap.has(model.id)) {
        rankMap.set(model.id, {});
      }
      const modelRanks = rankMap.get(model.id)!;
      modelRanks[attr] = currentRank;
      
      previousValue = currentValue;
    });
  });

  return rankMap;
};



// const recalculateResRanks = (models: ModelData[]) => {
//   const targetAttrs = selectedAttrs.length > 0 ? selectedAttrs : ["top_10_score", "top_100_score", "top_1000_score"];
//   const resModels = models.filter(model => model.type === "RES");
  
//   // 创建原始排名Map
//   const rawRankMap = new Map<string, { [key: string]: number }>();
  
//   targetAttrs.forEach(attr => {
//     // 按照value值降序排序
//     const sortedModels = [...resModels].sort((a, b) => {
//       const aValue = (a[attr] as { value: number })?.value ?? 0;
//       const bValue = (b[attr] as { value: number })?.value ?? 0;
//       return bValue - aValue;
//     });

//     // 处理相同值的排名逻辑
//     let currentRank = 1;
//     let previousValue: number | null = null;
    
//     sortedModels.forEach((model, index) => {
//       const currentValue = (model[attr] as { value: number })?.value ?? 0;
      
//       if (previousValue !== null && currentValue !== previousValue) {
//         currentRank = index + 1;
//       }
      
//       if (!rawRankMap.has(model.id)) {
//         rawRankMap.set(model.id, {});
//       }
//       const modelRanks = rawRankMap.get(model.id)!;
//       modelRanks[attr] = currentRank;
      
//       previousValue = currentValue;
//     });
//   });
  
//   // 进行最大最小归一化并乘以模型总层数
//   const normalizedRankMap = new Map<string, { [key: string]: number }>();
//   const totalLayers = resModels.length; // 总层数
  
//   targetAttrs.forEach(attr => {
//     // 找出该属性的最大最小排名
//     const ranks = Array.from(rawRankMap.values()).map(modelRanks => modelRanks[attr]);
//     const minRank = Math.min(...ranks);
//     const maxRank = Math.max(...ranks);
    
//     // 归一化每个模型在该属性上的排名
//     rawRankMap.forEach((modelRanks, modelId) => {
//       if (!normalizedRankMap.has(modelId)) {
//         normalizedRankMap.set(modelId, {});
//       }
//       const normalizedRanks = normalizedRankMap.get(modelId)!;
      
//       // 最大最小归一化：(rank - min) / (max - min) * totalLayers
//       // 注意：排名越小越好，所以最好的排名(minRank)归一化后为0
//       if (maxRank === minRank) {
//         normalizedRanks[attr] = 0; // 所有排名相同时归一化为0
//       } else {
//         const normalizedRank = (modelRanks[attr] - minRank) / (maxRank - minRank) * totalLayers;
//         normalizedRanks[attr] = normalizedRank;
//       }
//     });
//   });

//   return normalizedRankMap;
// };

  const calculateAverageRank = (model: ModelData) => {
    if (model.type !== "RES") return modelData.length;
    
    // 获取新的排名数据
    const rankMap = recalculateResRanks(modelData);
    const modelRanks = rankMap.get(model.id);

    if (!modelRanks) return modelData.length;

    // 使用selectedAttrs而不是硬编码的属性
    const targetAttrs = selectedAttrs.length > 0 ? selectedAttrs : ["top_10_score", "top_100_score", "top_1000_score"];
    const sum = targetAttrs.reduce((acc, attr) => {
      return acc + (modelRanks[attr] ?? modelData.length);
    }, 0);
    
    return sum / targetAttrs.length;
  };

  // 动态获取层数，而不是硬编码26
  const maxLayer = modelData.length > 0 ? Math.max(...modelData.map(model => model.layer)) : 25;
  const totalLayers = maxLayer + 1; // 因为层数从0开始

  const groupedData = Array.from({length: totalLayers}, (_, layer) =>
    modelData.filter((model) => model.layer === layer)
  );

  const getTopContributingAttrs = (model: ModelData) => {
    return selectedAttrs.map((attr) => {
      const metricData = model[attr];

      if (typeof metricData === "object" && metricData !== null && "rank" in metricData) {
        const rank = (metricData as { rank: number | null }).rank ?? 1;
        return {attr, contribution: 1 / rank};
      }
      return {attr, contribution: 0};
    })
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
  };

  React.useEffect(() => {
    if (modelData.length > 0 && !selectedModel) {
      dispatch(setSelectedModel(modelData[0]));
    }
  }, [modelData, selectedModel, dispatch]);

  const handleSelectedAttrsChange = (newAttrs: string[] | ((prevAttrs: string[]) => string[])) => {
    const updatedAttrs = typeof newAttrs === 'function' ? newAttrs(selectedAttrs) : newAttrs;
    dispatch(setSelectedAttrs(updatedAttrs));
  };

  return (
    <Paper className="overflow-hidden flex flex-col h-full p-2">
      <div className="flex flex-col h-full gap-2 overflow-hidden p-2">
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '20px' }}>
          SAE Discovery - {currentLLM === 'gpt2-small' ? 'GPT-2 Small (12 layers)' : 'Gemma 2 2B (26 layers)'}
        </Typography>

        <div className="flex-none flex items-center" style={{height: '40px'}}>
          <SelectMetricsDropdown selectedAttrs={selectedAttrs} setSelectedAttrs={handleSelectedAttrsChange}
                                 metricOptions={metricOptions}/>
        </div>

        <div className="flex-none" style={{height: '150px', marginTop: '15px'}}>
          <OverviewMatrix modelData={modelData} visibleRange={visibleRange}
                          calculateAverageRank={calculateAverageRank}/>
        </div>

        <div className="flex-grow overflow-hidden" style={{minHeight: 'calc(85% - 150px)', marginTop: '-15px'}}>
          <ModelTable groupedData={groupedData} selectedModel={selectedModel}
                      setSelectedModel={(model) => dispatch(setSelectedModel(model))}
                      visibleRange={visibleRange}
                      setVisibleRange={(range) => dispatch(setVisibleRange(range))}
                      getTopContributingAttrs={getTopContributingAttrs}
                      calculateAverageRank={calculateAverageRank}
          />
        </div>
      </div>
    </Paper>
  );
};

export default VisualizationDashboard;