import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  FileText,
  FolderKanban,
  Building2,
  BarChart3,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
} from "lucide-react";

interface Profile {
  full_name: string;
}

interface TestScore {
  category: string;
  score: number;
  total_marks: number;
}

const Index = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestScores, setLatestScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [profileRes, scoresRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
        supabase
          .from("skill_tests")
          .select("category, score, total_marks")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(5),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (scoresRes.data) setLatestScores(scoresRes.data);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const quickActions = [
    { to: "/test", label: "Take a Skill Test", icon: ClipboardCheck, color: "bg-primary/10 text-primary" },
    { to: "/resume", label: "Upload Resume", icon: FileText, color: "bg-secondary/20 text-secondary-foreground" },
    { to: "/projects", label: "Add Project", icon: FolderKanban, color: "bg-accent/10 text-accent" },
    { to: "/companies", label: "Browse Companies", icon: Building2, color: "bg-muted text-foreground" },
    { to: "/dashboard", label: "View Dashboard", icon: BarChart3, color: "bg-destructive/10 text-destructive" },
  ];

  const studyTips = [
    { icon: BookOpen, title: "Daily", tip: "Practice 2 coding problems and review one algorithm concept." },
    { icon: Target, title: "Weekly", tip: "Complete one full mock test and review weak areas." },
    { icon: TrendingUp, title: "Monthly", tip: "Build a mini project and update your portfolio." },
  ];

  const categoryLabels: Record<string, string> = {
    programming: "Programming",
    aptitude: "Aptitude",
    database: "Database",
    web_development: "Web Dev",
    logical_thinking: "Logic",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          Welcome back, {profile?.full_name || "there"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your skills, upload your work, and match with top companies.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to}>
            <Card className="group cursor-pointer border transition-all hover:shadow-md active:scale-[0.97]">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className={`rounded-lg p-2.5 ${action.color} transition-transform group-hover:scale-105`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Scores + Study Plan */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Scores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Recent Test Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestScores.length > 0 ? (
              <div className="space-y-3">
                {latestScores.map((s, i) => {
                  const pct = Math.round((s.score / s.total_marks) * 100);
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {categoryLabels[s.category] || s.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground w-10 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No tests taken yet</p>
                <Button asChild size="sm">
                  <Link to="/test">Take Your First Test</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-secondary" />
              Study Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studyTips.map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <tip.icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.tip}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
