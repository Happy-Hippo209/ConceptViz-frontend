"use client";
import { Paper, Typography } from "@mui/material";
import React, { useCallback, useState } from "react";
import * as d3 from "d3";
import { ClusterData, NearestFeature, SAEScatterResponse } from "@/types/sae";
import SimilarFeaturesPanel from "./SimilarFeaturesPanel";
import FeatureDetailPanel from "./FeatureDetailPanel";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setSelectedFeature,
  setSelectedTokens,
  setValidateFeatureId,
} from "@/redux/features/featureSlice";
import {
  FeatureActivation,
  ScatterPoint,
  TokenAnalysisResults,
  TokenFeatureInfo,
} from "@/types/types";

import {
  convertClusterData,
  createMainPoints,
  createQueryPoint,
  initD3Chart,
  initZoom,
  updateHexbins,
} from "@/utils/utils";
import { FeatureDetailResponse } from "@/types/feature";
import { debounce } from "lodash";

export default function SectionC1() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dataRef = React.useRef<ScatterPoint[]>([]);
  const selectedClusterRef = React.useRef<{ level: string; data: ClusterData }>(
    {
      level: "10",
      data: {
        clusterCount: 10,
        labels: [] as number[],
        colors: [] as string[],
        centers: [] as [number, number][],
        topics: {} as Record<string, string[]>,
        topicScores: {} as Record<string, number[]>,
        clusterColors: {} as Record<string, string>,
      },
    }
  );
  const [similarFeatures, setSimilarFeatures] = React.useState<
    NearestFeature[]
  >([]);
  const [, setClusterLevels] = React.useState<string[]>([]);
  const [hierarchicalClusters, setHierarchicalClusters] = React.useState<
    SAEScatterResponse["data"]["hierarchical_clusters"]
  >({});
  const [selectedFeatureId, setSelectedFeatureId] = React.useState<
    string | null
  >(null);
  const zoomRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null!);
  const xScale = React.useRef<d3.ScaleLinear<number, number>>(null!);
  const yScale = React.useRef<d3.ScaleLinear<number, number>>(null!);
  const [queryInfo, setQueryInfo] = React.useState<
    SAEScatterResponse["data"]["query"] | null
  >(null);
  const zoomThresholds = {
    low: { zoom: 1, level: "10" },
    medium: { zoom: 3, level: "30" },
    high: { zoom: 7, level: "90" },
  };
  const tooltipRef = React.useRef<
    d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
  >(null!);
  const transformRef = React.useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const [featureDetails, setFeatureDetails] = React.useState<NearestFeature[]>(
    []
  );
  const [, setSelectedPointId] = React.useState<number | null>(null);

  const { sae } = useAppSelector((state) => state.sae);
  console.log("SAE ID:", sae);
  const { query } = useAppSelector((state) => state.query);
  const currentLLM = useAppSelector(state => state.query.currentLLM);

  const dispatch = useAppDispatch();

  const [visiblePanelFeatures, setVisiblePanelFeatures] = useState<string[]>(
    []
  );

  const debouncedUpdateVisibleFeatures = useCallback(
    debounce((featureIds: string[]) => {
      if (
        JSON.stringify(featureIds.sort()) !==
        JSON.stringify(visiblePanelFeatures.sort())
      ) {
        setVisiblePanelFeatures(featureIds);

        dataRef.current = dataRef.current.map((point) => ({
          ...point,
          isVisibleInPanel: featureIds.includes(point.featureId.toString()),
        }));

        handleUpdateHexbins(transformRef.current.k);
      }
    }, 150),
    [visiblePanelFeatures]
  );

  const handleVisibleFeaturesChange = (featureIds: string[]) => {
    debouncedUpdateVisibleFeatures(featureIds);
  };

  React.useEffect(() => {
    if (sae) {
      resetAllStates();
      fetchScatterData(sae, query, currentLLM);
    }
  }, [sae, query, currentLLM]);

  React.useEffect(() => {
    if (dataRef.current.length > 0) {
      if (!svgRef.current?.querySelector("g")) {
        if (!svgRef.current) return;
        initD3Chart(
          svgRef,
          dataRef,
          xScale,
          yScale,
          tooltipRef,
          transformRef,
          zoomRef,
          handleUpdateHexbins,
          initZoom,
          hierarchicalClusters,
          selectedClusterRef,
          zoomThresholds
        );
      }
    }
  }, [dataRef.current.length]);

  const fetchScatterData = async (saeId: string, queryStr?: string, llmModel?: string) => {
    try {
      const url = new URL(
        "http://localhost:6006/api/sae/scatter",
        window.location.origin
      );
      url.searchParams.append("sae_id", saeId);
      if (queryStr) url.searchParams.append("query", queryStr);
      if (llmModel) url.searchParams.append("llm", llmModel);
      const response = await fetch(url.toString());
      const json: SAEScatterResponse = await response.json();
      console.log(json);
      const data = json.data;

      const similarFeatureIds = new Set(
        data.query?.nearest_features.map((f) => f.feature_id) || []
      );

      const visibleCoordinates = new Set(
        data.query?.nearest_features.map((f) => f.coordinates.join(",")) || []
      );

      const mainPoints = createMainPoints(
        data,
        visibleCoordinates,
        selectedClusterRef
      ).map((point: ScatterPoint) => {
        const similarFeature = data.query?.nearest_features.find(
          (f) => f.feature_id === point.featureId.toString()
        );

        return {
          ...point,
          isQuerySimilar: similarFeatureIds.has(point.featureId.toString()),
          similarity: similarFeature?.similarity,
        };
      });

      const queryPoint = createQueryPoint(data, selectedClusterRef);

      dataRef.current = [...mainPoints, ...(queryPoint ? [queryPoint] : [])];

      const clusterLevels = Object.keys(data.hierarchical_clusters);
      const defaultLevel = clusterLevels.includes("10")
        ? "10"
        : clusterLevels[0];
      selectedClusterRef.current = {
        level: defaultLevel,
        data: convertClusterData(defaultLevel, data.hierarchical_clusters),
      };

      setClusterLevels(clusterLevels);
      setHierarchicalClusters(data.hierarchical_clusters);

      setQueryInfo(data.query);
      if (data.query) {
        setSimilarFeatures(data.query.nearest_features);
      } else {
        setSimilarFeatures([]);
      }
    } catch (error) {
      console.error("Failed to fetch scatter data:", error);
    }
  };

  const zoomToPoint = (p: ScatterPoint, scale: number = 4) => {
    if (
      !svgRef.current ||
      !xScale.current ||
      !yScale.current ||
      !zoomRef.current
    )
      return;
    const svg = d3.select(svgRef.current);
    const width: number = svgRef.current.clientWidth;
    const height: number = svgRef.current.clientHeight;
    const targetX: number = xScale.current(p.x);
    const targetY: number = yScale.current(p.y);

    svg
      .transition()
      .duration(750)
      .call((transition) =>
        zoomRef.current.transform(
          transition as any,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-targetX, -targetY)
        )
      );

    const g = svg.select("g");
    g.selectAll(".highlight-point").remove();
    g.append("circle")
      .attr("class", "highlight-point")
      .attr("cx", targetX)
      .attr("cy", targetY)
      .attr("r", 6)
      .style("fill", "none")
      .style("stroke", p.color || "#1976d2")
      .style("stroke-width", 2)
      .style("opacity", 0)
      .transition()
      .duration(300)
      .style("opacity", 1);
  };

  const getFeatureDescription = (featureId: string): string => {
    let description = `Feature ${featureId}`;
    if (dataRef.current.length > 0) {
      const indexInScatterData = dataRef.current.findIndex(
        (p) => p.featureId.toString() === featureId
      );
      if (
        indexInScatterData >= 0 &&
        dataRef.current[indexInScatterData].description
      ) {
        description = dataRef.current[indexInScatterData].description;
      }
    }
    return description;
  };

  const handleFeatureClick = (feature: NearestFeature) => {
    setSelectedFeatureId(feature.feature_id);

    fetch(
      `http://localhost:6006/api/feature/detail?feature_id=${feature.feature_id}&sae_id=${sae}&llm=${currentLLM}`
    )
      .then((res: Response) => res.json())
      .then((resp_data: any) => {
        dispatch(setSelectedFeature({ data: resp_data.data }));
        const point: ScatterPoint | undefined = dataRef.current.find(
          (p) => p.featureId === Number(feature.feature_id)
        );
        if (!point) return;

        let similar_features: NearestFeature[] = [];
        for (
          let i = 0;
          i < resp_data.data.raw_stats.similar_features.feature_ids.length;
          i++
        ) {
          const featureId =
            resp_data.data.raw_stats.similar_features.feature_ids[i].toString();

          const description = getFeatureDescription(featureId);

          similar_features.push({
            feature_id: featureId,
            similarity: resp_data.data.raw_stats.similar_features.values[i],
            description: description,
            coordinates: [0, 0],
          });
        }

        setFeatureDetails(similar_features);
        zoomToPoint(point);
      });
  };

  const handleUpdateHexbins = (scale: number) => {
    updateHexbins(
      svgRef,
      dataRef,
      xScale,
      yScale,
      tooltipRef,
      selectedClusterRef,
      scale,
      handlePointClick
    );
  };

  const handlePointClick = (point: ScatterPoint) => {
    if (point.isQuery) {
      setSimilarFeatures(queryInfo?.nearest_features ?? []);
      setFeatureDetails([]);
      setSelectedPointId(null);
      dispatch(setSelectedFeature(null));

      dataRef.current = dataRef.current.map((p) => ({
        ...p,
        isSelected: false,
        isSelectedSimilar: false,
      }));

      handleUpdateHexbins(transformRef.current.k);
      return;
    }

    fetch(
      `http://localhost:6006/api/feature/detail?feature_id=${point.featureId}&sae_id=${sae}&llm=${currentLLM}`
    )
      .then((res) => res.json())
      .then((resp_data) => {
        const detail = resp_data.data as FeatureDetailResponse;
        dispatch(setSelectedFeature({ data: detail }));

        let similar_features: NearestFeature[] = [];
        for (
          let i = 0;
          i < detail.raw_stats.similar_features.feature_ids.length;
          i++
        ) {
          const featureId =
            detail.raw_stats.similar_features.feature_ids[i].toString();

          const description = getFeatureDescription(featureId);

          similar_features.push({
            feature_id: featureId,
            similarity: detail.raw_stats.similar_features.values[i],
            description: description,
            coordinates: [0, 0],
          });
        }
        setFeatureDetails(similar_features);

        const similarFeatureIds = detail.raw_stats.similar_features.feature_ids; 

        dataRef.current = dataRef.current.map((p) => {
          const isSelected = p.featureId === point.featureId;
          const isSelectedSimilar =
            similarFeatureIds.includes(p.featureId) &&
            p.featureId !== point.featureId;

          return {
            ...p,
            visible: isSelected || p.visible,
            isSelected: isSelected,
            isSelectedSimilar: isSelectedSimilar,
          };
        });
        setSelectedPointId(point.featureId);
        handleUpdateHexbins(transformRef.current.k);
      });

    zoomToPoint(point);
  };

  const { selectedTokens } = useAppSelector((state) => state.feature);
  const { validateFeatureId } = useAppSelector((state) => state.feature);
  const [_, setTokenAnalysisResults] = useState<TokenAnalysisResults | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const analyzeTokensRequest = async () => {
    if (!selectedTokens?.length || !validateFeatureId || !sae) return;

    let controller: AbortController | null = null;
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal;

      const requestData = {
        feature_id: validateFeatureId,
        sae_id: sae,
        llm: currentLLM,
        selected_prompt_tokens: selectedTokens.map((token) => ({
          prompt: token.prompt,
          token_index: token.token_index + 1,
        })),
      };

      const response = await fetch(
        "http://localhost:6006/api/feature/tokens-analysis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (signal.aborted) {
        return;
      }

      setTokenAnalysisResults(data.data);

      const unionIds = new Set(data.data.related_features_union || []);
      const promptTokenFeatures: Array<TokenFeatureInfo> =
        data.data.prompt_token_features || [];

      dataRef.current = dataRef.current.map((point: ScatterPoint) => {
        const pointId = point.featureId.toString();
        const isInUnion = unionIds.has(pointId);

        if (isInUnion) {
          const relatedTokens: {
            prompt: string;
            index: number;
            activation: number;
          }[] = [];
          Object.values(promptTokenFeatures).forEach((ptf) => {
            const ptfTyped = ptf as any;
            const features = ptfTyped.features || [];

            const feature = features.find(
              (f: FeatureActivation) => f.feature_id === pointId
            );

            if (feature) {
              relatedTokens.push({
                prompt: ptfTyped.prompt,
                index: ptfTyped.token_index,
                activation: feature.activation,
              });
            }
          });

          return {
            ...point,
            relatedToken: relatedTokens.length > 0 ? relatedTokens : null,
            visible: point.visible,
          };
        }

        return {
          ...point,
          relatedToken: null,
        };
      });

      if (svgRef.current) {
        handleUpdateHexbins(transformRef.current.k);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("分析token失败:", error);
        setAnalysisError(error.message || "分析过程中发生错误");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  React.useEffect(() => {
    const analyzeTokens = async () => {
      await analyzeTokensRequest();
    };

    analyzeTokens();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); 
        abortControllerRef.current = null;
      }
    };
  }, [selectedTokens, validateFeatureId, sae]);

  const resetAllStates = () => {
    setSelectedFeatureId(null);
    setSimilarFeatures([]);
    setFeatureDetails([]);
    setQueryInfo(null);
    setSelectedPointId(null);
    setVisiblePanelFeatures([]);
    setTokenAnalysisResults(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setClusterLevels([]);
    setHierarchicalClusters({});
    dispatch(setValidateFeatureId(null));
    dispatch(setSelectedTokens([]));

    dataRef.current = [];
    selectedClusterRef.current = {
      level: "10",
      data: {
        clusterCount: 10,
        labels: [] as number[],
        colors: [] as string[],
        centers: [] as [number, number][],
        topics: {} as Record<string, string[]>,
        topicScores: {} as Record<string, number[]>,
        clusterColors: {} as Record<string, string>,
      },
    };

    dispatch(setSelectedFeature(null));

    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <Paper className="h-full overflow-hidden relative">
      {isAnalyzing && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-blue-100 text-blue-700 px-4 py-2">
          Analyzing tokens...
        </div>
      )}
      {analysisError && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-100 text-red-700 px-4 py-2">
          {analysisError}
        </div>
      )}
      <div className="absolute top-2 left-2 z-10 bg-white/90 rounded shadow-md px-3 flex flex-col items-start border border-gray-200">
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{ fontSize: "20px" }}
        >
          Feature Explorer
        </Typography>
      </div>
      <SimilarFeaturesPanel
        similarFeatures={similarFeatures}
        selectedFeatureId={selectedFeatureId}
        hasQueryPoint={dataRef.current.some((p) => p.isQuery)}
        onFeatureClick={handleFeatureClick}
        onVisibleFeaturesChange={handleVisibleFeaturesChange}
      />
      {/* <FeatureDetailPanel
        similarFeatures={featureDetails}
        selectedFeatureId={selectedFeatureId}
        hasQueryPoint={dataRef.current.some((p) => p.isQuery)}
        onFeatureClick={handleFeatureClick}
        onVisibleFeaturesChange={handleVisibleFeaturesChange}
      /> */}

      <div className="h-full">
        {/* <div className="absolute top-2 right-2 z-10 bg-white rounded shadow p-3">
        </div> */}

        {/* 添加一个渐变图例 */}
        <div className="absolute top-2 right-2 z-10 bg-white/90 rounded shadow-md px-2 py-1 flex flex-col items-center border border-gray-200">
          <Typography variant="subtitle2">Legend</Typography>
          <div
            className="w-full h-1 rounded-sm mb-1"
            style={{
              background: "linear-gradient(to right, #1976d2, #e0e0e0)",
            }}
          />
          <div className="w-full flex justify-between text-xs">
            <span className="text-[#1976d2] font-medium mr-2">Relevant</span>
            <span className="text-[#cccccc] font-regular ml-2">Irrelevant</span>
          </div>
          <div className="w-full flex items-center mt-1 text-xs">
            <svg width="16" height="16" className="mr-1">
              <circle
                cx="8"
                cy="6"
                r="3"
                fill="red"
                stroke="red"
                strokeWidth="1"
              />
              <line
                x1="8"
                y1="6"
                x2="8"
                y2="14"
                stroke="#666666"
                strokeWidth="2"
              />
            </svg>
            <span>Query Point</span>
          </div>
          <div className="w-full flex items-center mt-1 text-xs">
            <svg width="16" height="16" className="mr-1">
              <polygon points="8,4 12,12 4,12" fill="red" />
            </svg>
            <span>Intersection Point</span>
          </div>
        </div>

        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </Paper>
  );
}
