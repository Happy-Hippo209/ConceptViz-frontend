export const metricOptions = [
  // Unsupervised Metrics
  { value: "l0_sparsity", label: "L0 Sparsity" },
  { value: "l2_ratio", label: "L2 Ratio" },
  { value: "explained_variance", label: "Explained Variance" },
  { value: "kl_div_score", label: "KL Divergence" },
  { value: "ce_loss_score", label: "CE Loss" },

  // Sparse Probing
  { value: "llm_test_accuracy", label: "LLM Test Acc" },
  { value: "llm_top_1_test_accuracy", label: "LLM Top-1 Acc" },
  { value: "llm_top_2_test_accuracy", label: "LLM Top-2 Acc" },
  { value: "llm_top_5_test_accuracy", label: "LLM Top-5 Acc" },
  { value: "sae_test_accuracy", label: "SAE Test Acc" },
  { value: "sae_top_1_test_accuracy", label: "SAE Top-1 Acc" },
  { value: "sae_top_2_test_accuracy", label: "SAE Top-2 Acc" },
  { value: "sae_top_5_test_accuracy", label: "SAE Top-5 Acc" },

  // Spurious Correlation Removal
  { value: "scr_metric_threshold_10", label: "SCR (10)" },
  { value: "scr_metric_threshold_20", label: "SCR (20)" },

  // Targeted Probe Perturbation
  { value: "tpp_threshold_10", label: "TPP (10)" },
  { value: "tpp_threshold_20", label: "TPP (20)" },

  // Top Scores
  { value: "top_10_score", label: "Top 10 Score" },
  { value: "top_100_score", label: "Top 100 Score" },
  { value: "top_1000_score", label: "Top 1000 Score" },
]; 