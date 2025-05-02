
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import { ProfileSettingsProvider } from "./contexts/ProfileSettingsContext";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import HelpPage from "./pages/HelpPage";
import ImageManager from "./pages/ImageManager";
import { PostHogProvider } from "./components/PostHogProvider";
import { AuthProvider } from "./hooks/useAuth";
import { PasswordProtection } from "./components/PasswordProtection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PostHogProvider>
        {/* Move AuthProvider outside of ProfileSettingsProvider */}
        <AuthProvider>
          <ProfileSettingsProvider>
            <Toaster />
            <Sonner />
            <PasswordProtection>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/image-manager" element={<ImageManager />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </PasswordProtection>
          </ProfileSettingsProvider>
        </AuthProvider>
      </PostHogProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
