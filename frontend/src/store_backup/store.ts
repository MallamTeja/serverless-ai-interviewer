import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import createIdbStorage from '@piotr-cz/redux-persist-idb-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import interviewSliceReducer from './interview';
import candidateSliceReducer from './candidateSlice';

// Initialize IndexedDB on app startup (placeholder for future implementation)
// initializeDB().catch(console.error);

// IndexedDB storage configuration 
const storage = createIdbStorage({
  name: 'ai-interview-assistant',
  version: 1
});

// Persist config
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['candidates', 'interview']
};

// Combine reducers
const rootReducer = combineReducers({
  candidates: candidateSliceReducer,
  interview: interviewSliceReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

// Create persistor
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
