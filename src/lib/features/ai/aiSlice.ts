import { Edit, editText } from "@/lib/api/editText";
import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const fetchEdits = createAsyncThunk(
    "ai/fetchEditsStatus",
    async ({prompt, originalText, startPoint}: {prompt: string, originalText: string, startPoint: SerializedPointType}, thunkAPI) => {
        const response  = editText(prompt, originalText);
        return response;
    }
)

export type SerializedPointType = {
    key: string;
    offset: number;
    type: "text" | "element";
}

interface AiState {
    inAiMode: boolean;
    loading: boolean;
    edits: Edit[];
    startPoint: SerializedPointType | null;
}

const initialState: AiState = {
    inAiMode: false,
    loading: false,
    edits: [],
    startPoint: null
}

export const aiSlice = createSlice({

    name: "ai",
    initialState,
    reducers: {
        setStartPoint: (state, action: PayloadAction<SerializedPointType>) => {
            state.startPoint = action.payload;
        },
        setAcceptedStatus(state, action: PayloadAction<{id: string, accepted: boolean}>) {
            const edit = state.edits.find(edit => edit.id === action.payload.id);
            if (edit) {
                edit.accepted = action.payload.accepted;
            }
        },
        setAllAcceptedStatuses(state, action: PayloadAction<boolean>) {
            state.edits.forEach(edit => edit.accepted = action.payload);
        },
        reset: (state) => initialState
    },
    extraReducers: builder => {
        builder.addCase(fetchEdits.pending, (state, action) => {
            state.inAiMode = true;
            state.loading = true;
            state.startPoint = action.meta.arg.startPoint;
        });

        builder.addCase(fetchEdits.fulfilled, (state, action) => {
            state.loading = false;
            state.edits = action.payload;
        });
        
        builder.addCase(fetchEdits.rejected, (state) => {
            state.loading = false;
            state.inAiMode = false;
        });
    }
});

export default aiSlice.reducer;
export { fetchEdits };
export const { setStartPoint, setAcceptedStatus, reset, setAllAcceptedStatuses } = aiSlice.actions;