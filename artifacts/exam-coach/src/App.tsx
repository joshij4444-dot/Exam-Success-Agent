import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";

// Import Pages
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Syllabus from "@/pages/Syllabus";
import Planner from "@/pages/Planner";
import Progress from "@/pages/Progress";
import AITeacher from "@/pages/AITeacher";
import Onboarding from "@/pages/Onboarding";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(260, 100%, 65%)",
    colorForeground: "hsl(230, 20%, 95%)",
    colorMutedForeground: "hsl(230, 15%, 65%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(230, 35%, 10%)",
    colorInput: "hsl(230, 30%, 20%)",
    colorInputForeground: "hsl(230, 20%, 95%)",
    colorNeutral: "hsl(230, 30%, 18%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f172a] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#1e293b] shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-white tracking-tight",
    headerSubtitle: "text-[#94a3b8]",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-[#cbd5e1] font-medium",
    footerActionLink: "text-[#8b5cf6] hover:text-[#a78bfa] font-medium",
    footerActionText: "text-[#94a3b8]",
    dividerText: "text-[#64748b]",
    identityPreviewEditButton: "text-[#8b5cf6] hover:text-[#a78bfa]",
    formFieldSuccessText: "text-[#10b981]",
    alertText: "text-[#ef4444]",
    logoBox: "h-12 flex justify-center mb-4",
    logoImage: "h-full w-auto object-contain",
    socialButtonsBlockButton: "bg-[#1e293b] border-[#334155] hover:bg-[#334155] transition-colors",
    formButtonPrimary: "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all",
    formFieldInput: "bg-[#1e293b] border-[#334155] text-white focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all",
    footerAction: "justify-center mt-2",
    dividerLine: "bg-[#334155]",
    alert: "bg-[#7f1d1d]/20 border border-[#ef4444]/50",
    otpCodeFieldInput: "bg-[#1e293b] border-[#334155] text-white",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8b5cf6]/20 via-background to-background pointer-events-none" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8b5cf6]/20 via-background to-background pointer-events-none" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener]);

  return null;
}

function HomeRedirect() {
  const [, setLocation] = useLocation();

  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <ProtectedRoutes />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoutes() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/syllabus" component={Syllabus} />
      <Route path="/planner" component={Planner} />
      <Route path="/progress" component={Progress} />
      <Route path="/ai-teacher" component={AITeacher} />
      <Route path="/onboarding" component={Onboarding} />
      {/* Catch-all inside protected routes */}
      <Route path="/:rest*">
        {() => {
          const [, setLocation] = useLocation();
          useEffect(() => { setLocation('/dashboard', { replace: true }); }, []);
          return null;
        }}
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/:rest*">
            {() => (
              <Show when="signed-in" fallback={<Home />}>
                <AppLayout>
                  <ProtectedRoutes />
                </AppLayout>
              </Show>
            )}
          </Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}