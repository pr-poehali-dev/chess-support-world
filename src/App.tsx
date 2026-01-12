
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import OnlineChess from "./pages/OnlineChess";
import TournamentHall from "./pages/TournamentHall";
import TournamentStandings from "./pages/TournamentStandings";
import PusherTest from "./pages/PusherTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/online-chess" element={<OnlineChess />} />
          <Route path="/online-chess/:gameId" element={<OnlineChess />} />
          <Route path="/game/:gameId" element={<OnlineChess />} />
          <Route path="/tournament/:tournamentId" element={<TournamentHall />} />
          <Route path="/tournament/:tournamentId/standings" element={<TournamentStandings />} />
          <Route path="/pusher-test" element={<PusherTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;