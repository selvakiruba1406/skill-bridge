import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface CompanyRole {
  id: string;
  company_id: string;
  title: string;
  required_skills: Record<string, number>;
}

const COLORS = [
  "hsl(199, 89%, 38%)",
  "hsl(45, 93%, 58%)",
  "hsl(152, 60%, 42%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
];

const skillLabels: Record<string, string> = {
  programming: "Programming",
  aptitude: "Aptitude",
  database: "Database",
  web_development: "Web Dev",
  logical_thinking: "Logic",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [resumeCount, setResumeCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) return;
      const [compRes, rolesRes, scoresRes, resumeRes, projRes] = await Promise.all([
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("company_roles").select("id, company_id, title, required_skills"),
        supabase.from("skill_tests").select("category, score, total_marks").eq("user_id", user.id),
        supabase.from("resumes").select("id").eq("user_id", user.id),
        supabase.from("projects").select("id").eq("user_id", user.id),
      ]);

      if (compRes.data) setCompanies(compRes.data);
      if (rolesRes.data) setRoles(rolesRes.data as CompanyRole[]);
      if (resumeRes.data) setResumeCount(resumeRes.data.length);
      if (projRes.data) setProjectCount(projRes.data.length);

      // Get latest score per category
      if (scoresRes.data) {
        const latest: Record<string, number> = {};
        scoresRes.data.forEach((s) => {
          const pct = Math.round((s.score / s.total_marks) * 100);
          if (!latest[s.category] || pct > latest[s.category]) {
            latest[s.category] = pct;
          }
        });
        setUserScores(latest);
      }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const companyRoles = roles.filter((r) => r.company_id === selectedCompany);
  const activeRole = roles.find((r) => r.id === selectedRole);

  // Radar data
  const radarData = activeRole
    ? Object.entries(activeRole.required_skills).map(([key, req]) => ({
        skill: skillLabels[key] || key,
        required: req,
        yours: userScores[key] || 0,
      }))
    : Object.keys(skillLabels).map((key) => ({
        skill: skillLabels[key],
        required: 0,
        yours: userScores[key] || 0,
      }));

  // Bar data
  const barData = radarData.map((d) => ({
    ...d,
    gap: Math.max(0, d.required - d.yours),
  }));

  // Overall match
  const overallMatch = activeRole
    ? Math.round(
        Object.entries(activeRole.required_skills).reduce((sum, [key, req]) => {
          const score = userScores[key] || 0;
          return sum + Math.min(100, (score / (req as number)) * 100);
        }, 0) / Object.keys(activeRole.required_skills).length
      )
    : 0;

  // Pie data for profile completeness
  const profilePie = [
    { name: "Tests Taken", value: Object.keys(userScores).length, color: COLORS[0] },
    { name: "Resume", value: Math.min(resumeCount, 1), color: COLORS[1] },
    { name: "Projects", value: Math.min(projectCount, 3), color: COLORS[2] },
  ];
  const profileTotal = profilePie.reduce((s, p) => s + p.value, 0);
  const profileMax = 5 + 1 + 3; // 5 tests + 1 resume + 3 projects
  const profilePct = Math.round((profileTotal / profileMax) * 100);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard & Analysis</h1>
        <p className="text-muted-foreground">Compare your skills against company requirements</p>
      </div>

      {/* Company + Role Selector */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedCompany} onValueChange={(v) => { setSelectedCompany(v); setSelectedRole(""); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCompany && (
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {companyRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-primary">{Object.keys(userScores).length}/5</p>
            <p className="text-xs text-muted-foreground mt-1">Tests Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-primary">{resumeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Resumes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold tabular-nums text-primary">{projectCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold tabular-nums ${overallMatch >= 70 ? "text-accent" : overallMatch >= 40 ? "text-secondary" : "text-destructive"}`}>
              {activeRole ? `${overallMatch}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Role Match</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Skill Comparison
            </CardTitle>
            <CardDescription>Your scores vs requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Required" dataKey="required" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.15} />
                <Radar name="Your Score" dataKey="yours" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Skill Gap Analysis
            </CardTitle>
            <CardDescription>Where you need to improve</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="skill" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="yours" name="Your Score" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="required" name="Required" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie - Profile Completeness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Profile Completeness
            </CardTitle>
            <CardDescription>{profilePct}% complete</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={profilePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {profilePie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gap Recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-secondary" />
              Improvement Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRole ? (
              <div className="space-y-3">
                {barData
                  .filter((d) => d.gap > 0)
                  .sort((a, b) => b.gap - a.gap)
                  .map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Badge variant={d.gap > 30 ? "destructive" : "secondary"} className="text-xs w-16 justify-center">
                        -{d.gap}%
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{d.skill}</p>
                        <p className="text-xs text-muted-foreground">
                          You: {d.yours}% → Need: {d.required}%
                        </p>
                      </div>
                    </div>
                  ))}
                {barData.filter((d) => d.gap > 0).length === 0 && (
                  <p className="text-sm text-accent font-medium">🎉 You meet all requirements!</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Select a company and role to see gaps
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
