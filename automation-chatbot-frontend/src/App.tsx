import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Templates from "@/pages/Templates";
import Home from "@/pages/home";
import TestIntegration from "@/pages/TestIntegration";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Workflows from "@/pages/Workflows";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Pricing from "@/pages/Pricing";
import { N8nChatPage } from "@/pages/n8n-chat";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing}/>
      <Route path="/templates" component={Templates}/>
      <Route path="/pricing" component={Pricing}/>
      <Route path="/login" component={Login}/>
      <Route path="/signup" component={Signup}/>
      <Route path="/test" component={TestIntegration}/>
      
      {/* Feature and Docs pages - temporary redirects to landing */}
      <Route path="/features">
        <Landing />
      </Route>
      <Route path="/docs">
        <Landing />
      </Route>
      
      {/* Workflow Builder - Protected */}
      <Route path="/builder">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      
      {/* n8n Chat with Claude AI */}
      <Route path="/n8n-chat">
        <ProtectedRoute>
          <N8nChatPage />
        </ProtectedRoute>
      </Route>
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/workflows">
        <ProtectedRoute>
          <Workflows />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
