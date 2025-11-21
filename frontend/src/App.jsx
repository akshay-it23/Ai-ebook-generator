import React from 'react'
import {Routes,Route} from 'react-router-dom';
import proctectedRoute from './components/auth/proctectedRoute';

import LandingPAge from './pages/LandingPAge';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import EditorialPage from './pages/EditorialPage';
import ViewBookPage from './pages/ViewBookPage';
const App = () => {
  return (
    <div className='text-3xl'>
    <Routes>
      <Route path="/" element={<LandingPAge/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/signup" element={<SignupPage/>}/>

<Route
path="/dashboard"
element={<proctectedRoute><DashboardPage/></proctectedRoute>}
/>
<Route
path="/editor/:bookId"
element={<proctectedRoute><EditorialPage/></proctectedRoute>}
/>
<Route
path="/view-book/:bookId"
element={<proctectedRoute><ViewBookPage/></proctectedRoute>}
/>
<Route
path="/view-book/:bookId"
element={<proctectedRoute><View/></proctectedRoute>}
/>

<Route 
path="/profile"
element={<proctectedRoute></proctectedRoute>}

/>




    </Routes>
    </div>
 )
}

export default App
