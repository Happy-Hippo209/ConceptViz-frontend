"use client";
import { Paper, Skeleton } from "@mui/material";
import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import QueryInput from "@/app/components/Concept Query/QueryInput";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setLayerTypeData,
  setQueryResult,
  setOptimizedQuery,
  setOptimizedQueryResult,
} from "@/redux/features/querySlice";
import { setModelData } from "@/redux/features/modelSlice";
// 静态导入JSON文件
import gemmaMetricsData from "@/data/gemma-2-2b.json";

const Plot = dynamic(() => import("@/app/components/Concept Query/Plot"), { ssr: false });

export default function ConceptQuery() {
  const dispatch = useAppDispatch();
  const queryResult = useAppSelector((state) => state.query.queryResult);
  const modelData = useAppSelector((state) => state.model.modelData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);

  const handleSearch = async (query: string, llm: string) => {
    if (!query) return;

    setError(null);
    setTimeoutError(false);
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setTimeoutError(true);
        setLoading(false);
      }, 60 * 1000);

      const response = await fetch("http://localhost:6006/api/query/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: query.trim(),
          llm: llm
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || `请求失败: ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // 根据LLM参数确定层数和模型配置
      const getModelConfig = (llm: string) => {
        switch (llm) {
          case 'gpt2-small':
            return {
              layers: 12,
              idFormat: (layer: number) => `${layer}-res_post_32k-oai`
            };
          case 'gemma_2_2b':
          default:
            return {
              layers: 26,
              idFormat: (layer: number) => `${layer}-gemmascope-res-16k`
            };
        }
      };

      const modelConfig = getModelConfig(llm);

      dispatch(setQueryResult({
        bins: data.data.similarity_distribution.bins,
        counts: data.data.similarity_distribution.counts,
      }));

      if (data.data.similarity_distribution_optimized) {
        dispatch(setOptimizedQuery(data.data.similarity_distribution_optimized.query));
        dispatch(setOptimizedQueryResult({
          bins: data.data.similarity_distribution_optimized.bins,
          counts: data.data.similarity_distribution_optimized.counts,
        }));
      }

      dispatch(setLayerTypeData({
        features: data.data.features,
        saeDistributions: data.data.sae_distributions,
      }));

      if (data.data.sae_distributions) {
        // 根据模型配置生成modelData
        const updatedModelData = Array.from({ length: modelConfig.layers }, (_, layer) => {
          const modelId = modelConfig.idFormat(layer);
          
          const distributionData = {
            top_10: data.data.sae_distributions.top_10?.distribution[modelId] || { percentage: 0, count: modelConfig.layers },
            top_100: data.data.sae_distributions.top_100?.distribution[modelId] || { percentage: 0, count: modelConfig.layers },
            top_1000: data.data.sae_distributions.top_1000?.distribution[modelId] || { percentage: 0, count: modelConfig.layers },
          };

          // 基础模型数据
          const baseModel = {
            id: modelId,
            type: "RES" as const,
            layer: layer,
            top_10_score: { value: distributionData.top_10.percentage, rank: distributionData.top_10.count },
            top_100_score: { value: distributionData.top_100.percentage, rank: distributionData.top_100.count },
            top_1000_score: { value: distributionData.top_1000.percentage, rank: distributionData.top_1000.count },
          };

          // 默认属性列表
          const defaultAttributes = {
            l0_sparsity: { value: 0, rank: modelConfig.layers },
            l2_ratio: { value: 0, rank: modelConfig.layers },
            explained_variance: { value: 0, rank: modelConfig.layers },
            kl_div_score: { value: 0, rank: modelConfig.layers },
            ce_loss_score: { value: 0, rank: modelConfig.layers },
            llm_test_accuracy: { value: 0, rank: modelConfig.layers },
            llm_top_1_test_accuracy: { value: 0, rank: modelConfig.layers },
            llm_top_2_test_accuracy: { value: 0, rank: modelConfig.layers },
            llm_top_5_test_accuracy: { value: 0, rank: modelConfig.layers },
            sae_test_accuracy: { value: 0, rank: modelConfig.layers },
            sae_top_1_test_accuracy: { value: 0, rank: modelConfig.layers },
            sae_top_2_test_accuracy: { value: 0, rank: modelConfig.layers },
            sae_top_5_test_accuracy: { value: 0, rank: modelConfig.layers },
            scr_metric_threshold_10: { value: 0, rank: modelConfig.layers },
            scr_metric_threshold_20: { value: 0, rank: modelConfig.layers },
            tpp_threshold_10: { value: 0, rank: modelConfig.layers },
            tpp_threshold_20: { value: 0, rank: modelConfig.layers },
          };

          // 尝试从JSON文件获取额外属性（仅对Gemma模型）
          if (llm === 'gemma_2_2b') {
            const jsonKey = `${layer}-gemmascope-res-16k`;
            if (gemmaMetricsData && (gemmaMetricsData as any)[jsonKey]) {
              // 合并JSON数据，但保持查询结果的top_scores优先级
              Object.assign(defaultAttributes, (gemmaMetricsData as any)[jsonKey]);
            }
          }

          // 合并所有数据
          return {
            ...baseModel,
            ...defaultAttributes
          };
        });

        dispatch(setModelData(updatedModelData));
      }

      setLoading(false);
    } catch (error) {
      if (!timeoutError) setError("Search request failed, please try again later.");
      setLoading(false);
    }
  };

  const chartRef = useRef<any>(null);

  return (
    <Paper className="p-4 overflow-hidden w-full h-full">
      <QueryInput onSubmit={handleSearch} />
      {error && <div className="text-red-500 my-2">{error}</div>}
      {timeoutError && <div className="text-red-500 my-2">Request timed out, please try again later.</div>}
      {loading ? (
        <Skeleton animation="wave" variant="rectangular" className="w-full h-64 mt-2" />
      ) : (
        <div className="relative h-[53%]">
          <Plot queryResult={queryResult} chartRef={chartRef} />
        </div>
      )}
    </Paper>
  );
}