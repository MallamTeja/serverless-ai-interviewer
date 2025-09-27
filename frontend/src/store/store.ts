import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import createIdbStorage from '@piotr-cz/redux-persist-idb-storage';
import interviewSlice from './interviewSlice';
import candidateSlice from './candidateSlice';

// IndexedDB storage configuration
const storage = createIdbStorage({
  name: 'ai-interview-assistant',
  version: 1,
  objectStoresMeta: [
    {
      name: 'redux-persist',
      keyPath: 'id',
      autoIncrement: false,
    },
  ],
});

// Root reducer configuration
const rootReducer = combineReducers({
  interview: interviewSlice,
  candidate: candidateSlice,
});

// Persist configuration
const persistConfig = {
  key: 'ai-interview-root',
  version: 1,
  storage,
  whitelist: ['interview', 'candidate'], // Only persist these slices
  serialize: true,
  debug: process.env.NODE_ENV === 'development',
  transforms: [],
  throttle: 100, // Throttle persist writes
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions from serializable checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore non-serializable values in these paths
        ignoredPaths: ['register'],
      },
      // Enable immutability checks in development
      immutableCheck: {
        warnAfter: 128,
      },
    }),
  devTools: {
    name: 'AI Interview Assistant',
    trace: process.env.NODE_ENV === 'development',
    traceLimit: 25,
    actionSanitizer: (action) => ({
      ...action,
      type: action.type,
    }),
    stateSanitizer: (state) => state,
  },
  preloadedState: undefined,
});

// Create persistor
export const persistor = persistStore(store, {
  manualPersist: false,
});

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

// Typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Store persistence utilities
export const purgePersistedState = () => {
  return persistor.purge();
};

export const flushPendingPersists = () => {
  return persistor.flush();
};

// Storage health check
export const checkStorageHealth = async (): Promise<boolean> => {
  try {
    await storage.setItem('health-check', 'ok');
    const result = await storage.getItem('health-check');
    await storage.removeItem('health-check');
    return result === 'ok';
  } catch (error) {
    console.error('IndexedDB storage health check failed:', error);
    return false;
  }
};

export default store;
