import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ModelData, VisibleRange } from "@/types/types";
import metricsData from "@/data/gemma-2-2b.json";

// Define metric groups
export const metricGroups = {
  unsupervised: ["l0_sparsity", "l2_ratio", "explained_variance", "kl_div_score", "ce_loss_score"],
  sparseProbing: [
    "llm_test_accuracy", "llm_top_1_test_accuracy", "llm_top_2_test_accuracy", "llm_top_5_test_accuracy",
    "sae_test_accuracy", "sae_top_1_test_accuracy", "sae_top_2_test_accuracy", "sae_top_5_test_accuracy"
  ],
  spuriousCorrelation: ["scr_metric_threshold_10", "scr_metric_threshold_20"],
  targetedProbe: ["tpp_threshold_10", "tpp_threshold_20"],
  topScores: ["top_10_score", "top_100_score", "top_1000_score"]
};

// Helper function to generate initial model data
const generateModelData = (): ModelData[] => {
  const data: ModelData[] = [];
  Object.entries(metricsData).forEach(([id, metrics]) => {
    const [layer, _, type] = id.split("-");
    data.push({
      id,
      type: type.toUpperCase(),
      layer: parseInt(layer),
      ...metrics,
    });
  });
  return data;
};

interface ModelState {
  modelData: ModelData[];
  selectedModel: ModelData | null;
  visibleRange: VisibleRange;
  selectedAttrs: string[];
  metricGroups: {
    [key: string]: string[];
  };
}

const initialState: ModelState = {
  modelData: generateModelData(),
  selectedModel: null,
  visibleRange: { start: 0, end: 3 },
  selectedAttrs: ["top_10_score","top_100_score","top_1000_score"],
  metricGroups,
};

export const modelSlice = createSlice({
  name: "model",
  initialState,
  reducers: {
    setModelData: (state, action: PayloadAction<ModelData[]>) => {
      state.modelData = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<ModelData | null>) => {
      state.selectedModel = action.payload;
    },
    setVisibleRange: (state, action: PayloadAction<VisibleRange>) => {
      state.visibleRange = action.payload;
    },
    setSelectedAttrs: (state, action: PayloadAction<string[]>) => {
      state.selectedAttrs = action.payload;
    },
    toggleMetricGroup: (state, action: PayloadAction<{ group: string; selected: boolean }>) => {
      const { group, selected } = action.payload;
      const groupMetrics = state.metricGroups[group] || [];
      
      if (selected) {
        // Add all metrics from the group that aren't already selected
        const newAttrs = [...state.selectedAttrs];
        groupMetrics.forEach(metric => {
          if (!newAttrs.includes(metric)) {
            newAttrs.push(metric);
          }
        });
        state.selectedAttrs = newAttrs;
      } else {
        // Remove all metrics from the group
        state.selectedAttrs = state.selectedAttrs.filter(
          attr => !groupMetrics.includes(attr)
        );
        
        if (state.selectedAttrs.length === 0) {
          state.selectedAttrs = ["top_10_score","top_100_score","top_1000_score"];
        }
      }
    },
  },
});

export const {
  setModelData,
  setSelectedModel,
  setVisibleRange,
  setSelectedAttrs,
  toggleMetricGroup,
} = modelSlice.actions;

export default modelSlice.reducer; 