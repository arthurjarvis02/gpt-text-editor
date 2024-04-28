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
    error: boolean;
    errorMessage?: string | null;
}

const initialState: AiState = {
    inAiMode: false,
    loading: false,
    suggestions: [],
    rendered: false,
    error: false
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
        setFormats(state, action: PayloadAction<{id: string, formats: TextFormatType[]}>) {
            state.suggestions = state.suggestions.map(suggestion => suggestion.id === action.payload.id ? {...suggestion, formats: action.payload.formats} : suggestion);
        },
        onceRendered(state) {
            state.rendered = true;
        },
        setCurrentSessionId(state, action: PayloadAction<string>) {
            state.currentSessionId = action.payload;
        },
        setOriginalContent(state, action: PayloadAction<{id: string, originalContent: SerializedParagraphTextTree}>) {
            state.suggestions = state.suggestions.map(suggestion => suggestion.id === action.payload.id ? {...suggestion, originalContent: action.payload.originalContent} : suggestion);
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

            console.log("Fetched edits", JSON.stringify(action.payload, null, 2));

            const res = action.payload;

            if (res.error || !res.suggestions) {

                state.error = true;
                state.errorMessage = res.errorMessage;

                return;
            }

            state.suggestions = res.suggestions.map(suggestion => ({
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
export const { setStartPoint, reset, setAccepted, setAllAccepted, setFormats, onceRendered, setCurrentSessionId, setOriginalContent } = aiSlice.actions;