import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeInterceptors } from "./config/apiInterceptor";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize API interceptors for automatic auth header injection
initializeInterceptors();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Elements
          stripe={loadStripe(
            import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
          )}
        >
          <App />
        </Elements>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
