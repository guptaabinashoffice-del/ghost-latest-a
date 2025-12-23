import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import CreatePost from "./pages/CreatePost";
import CreatePrompt from "./pages/CreatePrompt";
import LeadMagnet from "./pages/LeadMagnet";
import PostLibrary from "./pages/PostLibrary";
import ContentCalendar from "./pages/ContentCalendar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/create-prompt" element={<CreatePrompt />} />
            <Route path="/lead-magnet" element={<LeadMagnet />} />
            <Route path="/post-library" element={<PostLibrary />} />
            <Route path="/content-calendar" element={<ContentCalendar />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
