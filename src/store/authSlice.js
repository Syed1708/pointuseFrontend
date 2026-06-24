import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  loading: true, // starts as true to check silent refresh on app load
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.loading = false;
    },
     // 🛑 ADD THIS NEW REDUCER:
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
});

export const { setCredentials, logOut, updateUser, setLoading } = authSlice.actions;
export default authSlice.reducer;