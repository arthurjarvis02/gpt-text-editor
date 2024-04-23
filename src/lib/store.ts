import { configureStore } from "@reduxjs/toolkit"
import sessionsReducer from "./features/sessions/sessionsSlice"
import aiReducer from "./features/ai/aiSlice"

export const makeStore = () => {
    return configureStore({
        reducer: {
            sessions: sessionsReducer,
            ai: aiReducer
        }
    })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]