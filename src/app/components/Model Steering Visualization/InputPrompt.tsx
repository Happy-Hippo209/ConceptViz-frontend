"use client";
import React from "react";
import { Button, CircularProgress, TextField, Typography } from "@mui/material";
import { PlayCircle } from "lucide-react";
import { InputPromptProps } from "@/types/types";

const InputPrompt: React.FC<InputPromptProps> = ({
  prompt,
  setPrompt,
  handleSteer,
  loading,
}) => {
  return (
    <div className="flex mb-4 h-full w-full">
      <div className="flex-1">
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: "20px" }}
        >
          Output Steering
        </Typography>
        <TextField
          label="Input Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          multiline
          rows={1}
          fullWidth
          className="mb-2"
        />
        <Button
          variant="contained"
          onClick={handleSteer}
          disabled={loading || !prompt}
          startIcon={
            loading ? <CircularProgress size={20} /> : <PlayCircle size={20} />
          }
        >
          Generate
        </Button>
      </div>
    </div>
  );
};

export default InputPrompt;
