import { useGetOnboardingStatus, getGetOnboardingStatusQueryKey } from "@workspace/api-client-react";
import { useLocation, Link, useRoute } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  BrainCircuit,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Syllabus", url: "/syllabus", icon: BookOpen },
  { title: "Daily Planner", url: "/planner", icon: Calendar },
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "AI Teacher", url: "/ai-teacher", icon: BrainCircuit },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [matchOnboarding] = useRoute("/onboarding");
  
  const { data: onboardingStatus, isLoading: onboardingLoading } = useGetOnboardingStatus({
    query: { queryKey: getGetOnboardingStatusQueryKey(), enabled: true, retry: false },
  });

  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  // If not onboarded and not on onboarding page, redirect to onboarding
  if (!onboardingLoading && onboardingStatus && !onboardingStatus.completed && !matchOnboarding) {
    setLocation("/onboarding");
    return null;
  }

  // If onboarded and on onboarding page, redirect to dashboard
  if (!onboardingLoading && onboardingStatus?.completed && matchOnboarding) {
    setLocation("/dashboard");
    return null;
  }

  if (matchOnboarding) {
    return <div className="min-h-[100dvh] bg-background">{children}</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
                EC
              </div>
              <div className="font-bold text-lg text-foreground hidden md:block">ExamCrack</div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-2 py-4 gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      href={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 w-full">
              <Avatar className="w-9 h-9 border border-border">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden hidden md:block">
                <div className="text-sm font-medium truncate text-foreground">{user?.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                title="Sign Out"
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b border-border/50 flex items-center px-4 shrink-0 bg-card/50 backdrop-blur-sm sticky top-0 z-10 md:hidden">
            <SidebarTrigger />
            <div className="ml-4 font-bold">ExamCrack</div>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}