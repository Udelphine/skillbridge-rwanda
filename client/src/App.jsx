import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Challenges from './pages/Challenges';
import MyWork from './pages/MyWork';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/challenges" element={<ProtectedRoute roles={['student']}><Challenges /></ProtectedRoute>} />
        <Route path="/my-work" element={<ProtectedRoute roles={['student']}><MyWork /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;