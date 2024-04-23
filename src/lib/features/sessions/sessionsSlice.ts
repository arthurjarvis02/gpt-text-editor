import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { SerializedEditorState } from "lexical";

export type Session = {

    id: string;
    title?: string;
    editorState?: SerializedEditorState;
}

interface SessionsState {
    sessions: {[id: string]: Session};
    loading: boolean;
}

const initialState: SessionsState = {
    sessions: {},
    loading: true
};

export const sessionsSlice = createSlice({

    name: "sessions",
    initialState,
    reducers: {
        initializeSessions: (state, action: PayloadAction<SessionsState["sessions"]>) => {
            state.sessions = action.payload;
            state.loading = false;
        },
        addSession: (state, action: PayloadAction<Session>) => {
            state.sessions[action.payload.id] = action.payload;
        },
        deleteSession: (state, action: PayloadAction<string>) => {
            delete state.sessions[action.payload];
        },
        updateSession: (state, action: PayloadAction<Partial<Session> & {id: string}>) => {
            state.sessions[action.payload.id] = {...state.sessions[action.payload.id], ...action.payload};
        }
    }
});

export const { initializeSessions, addSession, deleteSession, updateSession } = sessionsSlice.actions;

export default sessionsSlice.reducer;