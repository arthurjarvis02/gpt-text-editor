import { Suggestion, editText } from "@/lib/api/editText";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { TextFormatType } from "lexical";

const fetchEdits = createAsyncThunk(
    "ai/fetchEditsStatus",
    async ({prompt, originalText, startPoint}: {prompt: string, originalText: string, startPoint: SerializedPointType}, thunkAPI) => {
        const response  = editText(prompt, originalText);
        return response;
    }
)

export type ClientSuggestion = Suggestion & {
    id: string;
    accepted: boolean;
    originalText: string;
}

export type SerializedPointType = {
    key: string;
    offset: number;
    type: "text" | "element";
}

interface AiState {
    inAiMode: boolean;
    loading: boolean;
    suggestions: ClientSuggestion[];
    startPoint: SerializedPointType | null;
}

const initialState: AiState = {
    inAiMode: false,
    loading: false,
    suggestions: [],
    startPoint: null
}

export const aiSlice = createSlice({

    name: "ai",
    initialState,
    reducers: {
        setStartPoint: (state, action: PayloadAction<SerializedPointType>) => {
            state.startPoint = action.payload;
        },
        reset: (state) => initialState,
        setAccepted(state, action: PayloadAction<{id: string, accepted: boolean}>) {
            state.suggestions = state.suggestions.map(suggestion => suggestion.id === action.payload.id ? {...suggestion, accepted: action.payload.accepted} : suggestion);
        },
        setAllAccepted(state, action: PayloadAction<boolean>) {
            state.suggestions = state.suggestions.map(suggestion => ({...suggestion, accepted: action.payload}));
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchEdits.pending, (state, action) => {
            state.inAiMode = true;
            state.loading = true;
            state.startPoint = action.meta.arg.startPoint;
        });

        builder.addCase(fetchEdits.fulfilled, (state, action) => {
            state.loading = false;
            const fullText = action.meta.arg.originalText;

            state.suggestions = action.payload.map(suggestion => ({
                id: `${suggestion.startCharacter}-${suggestion.endCharacter}`,
                accepted: true,
                originalText: fullText.slice(suggestion.startCharacter, suggestion.endCharacter),
                 ...suggestion
            }));
        });
        
        builder.addCase(fetchEdits.rejected, (state) => {
            state.loading = false;
            state.inAiMode = false;
        });
    }
});

export default aiSlice.reducer;
export { fetchEdits };
export const { setStartPoint, reset, setAccepted, setAllAccepted } = aiSlice.actions;