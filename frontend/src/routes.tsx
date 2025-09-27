import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Interviewee from './pages/Interviewee';
import Interviewer from './pages/Interviewer';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/interviewer" replace />
  },
  {
    path: '/interviewer',
    element: <Interviewer />
  },
  {
    path: '/interviewee',
    element: <Interviewee />
  },
  {
    path: '*',
    element: <Navigate to="/interviewer" replace />
  }
]);

export default router;
