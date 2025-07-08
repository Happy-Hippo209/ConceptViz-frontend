"use client";
import { setSelectedTokens } from "@/redux/features/featureSlice";
import { addHistoryItem, setHistory } from "@/redux/features/historySlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { TokenActivationResponse } from "@/types/feature";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Skeleton from "@mui/material/Skeleton";
import { format } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";

export default function SectionD1() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [activationData, setActivationData] =
    useState<TokenActivationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [userPrompts, setUserPrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState<Set<number>>(new Set());
  const [activationDataCache, setActivationDataCache] = useState<
    Record<string, TokenActivationResponse | null>
  >({});
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(
    new Set()
  );

  const dispatch = useAppDispatch();
  const { sae } = useAppSelector((state) => state.sae);
  const currentLLM = useAppSelector(state => state.query.currentLLM);
  const { validateFeatureId, selectedTokens } = useAppSelector(
    (state) => state.feature
  );
  const history = useAppSelector((state) => state.history.items);

  const selectedTokensSet = useMemo(
    () => new Set(selectedTokens.map((item) => item.token)),
    [selectedTokens]
  );

  useEffect(() => {
    // Clear test history, use prompts
    dispatch(setHistory([]));
    setUserPrompts([]);
    setSelectedFeature(null);
    setSelectedTokens([]);
    setActivationData(null);
    setActivationDataCache({});
    setLoadingPrompts(new Set());
    setExpandedPrompts(new Set());
    setError(null);
    setNewPrompt("");
  }, [sae]);

  useEffect(() => {
    if (validateFeatureId) {
      setSelectedFeature(validateFeatureId.toString());
      dispatch(
        addHistoryItem({
          feature_id: validateFeatureId.toString(),
          sae_id: sae,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [validateFeatureId]);

  useEffect(() => {
    if (selectedFeature && userPrompts.length > 0) {
      if (activationDataCache[selectedFeature]) {
        setActivationData(activationDataCache[selectedFeature]);
      } else {
        fetchTokenActivation(userPrompts);
      }
    }
  }, [selectedFeature, userPrompts, activationDataCache]);

  const fetchTokenActivation = async (
    prompts: string[],
    newPromptIndex?: number
  ) => {
    if (!selectedFeature || prompts.length === 0) return;
    if (newPromptIndex !== undefined) {
      setLoadingPrompts(new Set([newPromptIndex]));
    }

    try {
      const response = await fetch(
        "http://localhost:6006/api/feature/tokens-activation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feature_id: selectedFeature,
            llm: currentLLM,
            sae_id: sae,
            prompts,
          }),
        }
      );

      if (!response.ok) throw new Error("Request failed");
      const data: TokenActivationResponse = await response.json();

      // console.log(data.data.prompt_results);
      // Delete <bos> element
      data.data.prompt_results.forEach((result) => {
        result.tokens = result.tokens.filter(
          (token) => token.token !== "<bos>"
        );
      });
      // console.log(data.data.prompt_results);

      setActivationData(data);
      setActivationDataCache((prevCache) => ({
        ...prevCache,
        [selectedFeature]: data,
      }));
      setError(null);
    } catch (err) {
      setError("Failed to fetch activation data");
    } finally {
      setLoadingPrompts(new Set());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrompt.trim()) {
      const updatedPrompts = [...userPrompts, newPrompt.trim()];
      setUserPrompts(updatedPrompts);
      setNewPrompt("");
      await fetchTokenActivation(updatedPrompts, updatedPrompts.length - 1);
    }
  };

  const handleDeletePrompt = async (index: number) => {
    const updatedPrompts = userPrompts.filter((_, idx) => idx !== index);
    setUserPrompts(updatedPrompts);
    if (updatedPrompts.length > 0) await fetchTokenActivation(updatedPrompts);
    else setActivationData(null);
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "yyyy-MM-dd HH:mm:ss");
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY;
    event.preventDefault();
  };

  const getAllUniqueTokens = () => {
    if (!activationData?.data?.prompt_results) return [];
    const tokenSet = new Set<string>();
    activationData.data.prompt_results.forEach((result) => {
      result.tokens.forEach((t) => tokenSet.add(t.token));
    });
    return Array.from(tokenSet);
  };

  const handleTokenToggle = (
    token: string,
    prompt: string,
    tokenIndex: number
  ) => {
    if (!activationData?.data?.prompt_results) return;

    const isSelected = selectedTokens.some(
      (st) => st.prompt === prompt && st.token_index === tokenIndex
    );

    if (isSelected) {
      dispatch(
        setSelectedTokens(
          selectedTokens.filter(
            (item) =>
              !(item.prompt === prompt && item.token_index === tokenIndex)
          )
        )
      );
    } else {
      dispatch(
        setSelectedTokens([
          ...selectedTokens,
          {
            prompt,
            token_index: tokenIndex,
            token,
            activation_value:
              activationData.data.prompt_results.find(
                (r) => r.prompt === prompt
              )?.tokens[tokenIndex].activation_value || 0,
          },
        ])
      );
    }
  };

  const togglePromptExpand = (promptIndex: number) => {
    setExpandedPrompts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(promptIndex)) {
        newSet.delete(promptIndex);
      } else {
        newSet.add(promptIndex);
      }
      return newSet;
    });
  };

  const getTokenStyle = (activationValue: number) => {
    const normalizeThreshold = 50;
    const textColorThreshold = 0.4;

    const intensity =
      activationValue > 0
        ? Math.min(activationValue / normalizeThreshold, 1)
        : 0;
    const backgroundColor =
      activationValue > 0
        ? `rgba(49, 130, 206, ${intensity})`
        : "rgba(169, 169, 169, 0.1)";
    const color = intensity > textColorThreshold ? "white" : "inherit";

    return {
      backgroundColor,
      color,
      fontFamily: "sans-serif",
      fontSize: "18px",
    };
  };

  return (
    <Paper className="p-3 h-full flex flex-col overflow-x-hidden">
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: '20px' }}>Input Activation</Typography>
      <div className="py-2">
        <Typography
          variant="subtitle2"
          className="mb-2 text-gray-600"
          sx={{ fontSize: "18px", fontFamily: "sans-serif" }}
        >
          Test History
        </Typography>
        <div
          className="overflow-x-auto whitespace-nowrap py-2 -mx-4 px-4 scroll-smooth"
          onWheel={handleWheel}
        >
          <div className="inline-flex gap-2">
            {history.map((item) => (
              <Tooltip
                key={item.feature_id}
                title={
                  <div>
                    <div>SAE: {item.sae_id}</div>
                    <div>Time: {formatTimestamp(item.timestamp)}</div>
                  </div>
                }
                arrow
              >
                <div>
                  <Chip
                    label={item.feature_id}
                    onClick={() => setSelectedFeature(item.feature_id)}
                    color={
                      selectedFeature === item.feature_id
                        ? "primary"
                        : "default"
                    }
                    variant={
                      selectedFeature === item.feature_id
                        ? "filled"
                        : "outlined"
                    }
                    className="cursor-pointer hover:bg-opacity-90"
                  />
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
      <Divider />
      <Grid flex={10} className="h-full flex flex-col overflow-hidden mt-2">
        <Typography
          variant="subtitle2"
          className="my-2 text-gray-600"
          sx={{ fontSize: "18px", fontFamily: "sans-serif" }}
        >
          Activation
        </Typography>
        <div className="flex flex-col overflow-hidden flex-1">
          <form onSubmit={handleSubmit}>
            <Stack direction="row" spacing={1} className="mb-2">
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={3}
                variant="outlined"
                size="small"
                placeholder="Enter prompt..."
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    alignItems: "flex-start",
                  },
                }}
              />
              <IconButton type="submit" color="primary" className="self-start">
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
          </form>
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <div>
                {activationData &&
                  activationData.data &&
                  activationData.data.prompt_results &&
                  activationData.data.prompt_results.map((result, idx) => (
                    <React.Fragment key={`${result.prompt}-${idx}`}>
                      <div className="font-mono group relative hover:bg-gray-50 rounded px-2 py-3 transition-all duration-200">
                        {loadingPrompts.has(idx) ? (
                          <Skeleton
                            variant="rounded"
                            height={50}
                            animation="wave"
                          />
                        ) : (
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="leading-relaxed flex flex-wrap">
                                {result.tokens.map((tokenData, tokenIdx) => (
                                  <Tooltip
                                    key={`${tokenData.token}-${tokenIdx}`}
                                    title={`Activation: ${tokenData.activation_value.toFixed(
                                      2
                                    )}`}
                                    arrow
                                  >
                                    <span
                                      className={`px-1 ml-1 rounded hover:bg-opacity-50 transition-colors cursor-pointer font-medium whitespace-nowrap inline-block border-4 font-mono ${
                                        selectedTokens.some(
                                          (st) =>
                                            st.prompt === result.prompt &&
                                            st.token_index === tokenIdx
                                        )
                                          ? "border-[#ff6347]"
                                          : "border-transparent"
                                      }`}
                                      style={getTokenStyle(
                                        tokenData.activation_value
                                      )}
                                      onClick={() =>
                                        handleTokenToggle(
                                          tokenData.token,
                                          result.prompt,
                                          tokenIdx
                                        )
                                      }
                                    >
                                      {tokenData.token}
                                    </span>
                                  </Tooltip>
                                ))}
                              </div>
                            </div>
                            <IconButton
                              size="small"
                              className="invisible group-hover:visible transition-opacity duration-200 absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow text-red-500 hover:bg-red-50"
                              onClick={() => handleDeletePrompt(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        )}
                      </div>
                      {idx < activationData.data.prompt_results.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
              </div>
            )}
          </div>
        </div>
      </Grid>
    </Paper>
  );
}
