
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Plans from './pages/Plans';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import HelpPage from './pages/HelpPage';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ImageManager from './pages/ImageManager';
import ContentDetail from './pages/ContentDetail';
import { PostHogProvider } from './components/PostHogProvider';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './hooks/auth/useAuthContext';
import './App.css';

function App() {
  return (
    <PostHogProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/series" element={<Series />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/image-manager" element={<ImageManager />} />
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </PostHogProvider>
  );
}

export default App;
