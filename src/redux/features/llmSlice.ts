// src/redux/features/llmSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LLMState {
  selectedLLM: string;
  availableLLMs: { display: string; value: string }[];
}

const initialState: LLMState = {
  selectedLLM: 'gemma_2_2b', // 默认使用后端参数值
  availableLLMs: [
    { display: 'Gemma 2 2B', value: 'gemma_2_2b' },
    { display: 'GPT 2 Small', value: 'gpt2-small' }
  ]
};

export const LLMSlice = createSlice({
  name: 'llm',
  initialState,
  reducers: {
    setSelectedLLM: (state, action: PayloadAction<string>) => {
      state.selectedLLM = action.payload;
    },
    addLLM: (state, action: PayloadAction<{ display: string; value: string }>) => {
      if (!state.availableLLMs.find(llm => llm.value === action.payload.value)) {
        state.availableLLMs.push(action.payload);
      }
    }
  }
});

export const { setSelectedLLM, addLLM } = LLMSlice.actions;
export default LLMSlice.reducer;