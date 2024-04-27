import { editText } from "@/lib/api/editText";
import { ClientSuggestion, SerializedParagraphTextTree, SerializedPointType } from "@/lib/types";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { $createPoint, PointType, TextFormatType } from "lexical";

const fetchEdits = createAsyncThunk(
    "ai/fetchEditsStatus",
    async ({prompt, originalText, startPoint}: {prompt: string, originalText: string, startPoint: SerializedPointType}, thunkAPI) => {
        
        console.log("Fetching edits", prompt, originalText, startPoint);
        const response  = editText(prompt, originalText);
        return response;
    }
)

interface AiState {
    inAiMode: boolean;
    loading: boolean;
    suggestions: ClientSuggestion[];
    startPoint?: SerializedPointType;
    rendered: boolean;
    currentSessionId?: string;
}

const initialState: AiState = {
    inAiMode: false,
    loading: false,
    suggestions: [],
    rendered: false,
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
        },
        setOriginalContents(state, action: PayloadAction<{id: string, originalContents: SerializedParagraphTextTree}>) {
            state.suggestions = state.suggestions.map(suggestion => suggestion.id === action.payload.id ? {...suggestion, originalContents: action.payload.originalContents} : suggestion);
        },
        onceRendered(state) {
            state.rendered = true;
        },
        setCurrentSessionId(state, action: PayloadAction<string>) {
            state.currentSessionId = action.payload;
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchEdits.pending, (state, action) => {
            state.inAiMode = true;
            state.loading = true;
            state.startPoint = action.meta.arg.startPoint;
        });

        builder.addCase(fetchEdits.fulfilled, (state, action) => {

            console.log("Fetched edits", JSON.stringify(action.payload, null, 2))

            state.loading = false;

            state.suggestions = action.payload.map(suggestion => ({
                id: `${suggestion.startCharacter}-${suggestion.endCharacter}`,
                accepted: true,
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
export const { setStartPoint, reset, setAccepted, setAllAccepted, setOriginalContents, onceRendered, setCurrentSessionId } = aiSlice.actions;