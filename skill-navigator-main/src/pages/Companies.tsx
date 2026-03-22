import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Briefcase } from "lucide-react";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  website: string | null;
}

interface CompanyRole {
  id: string;
  company_id: string;
  title: string;
  experience_level: string | null;
  required_skills: Record<string, number>;
  qualifications: string[] | null;
  description: string | null;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [compRes, rolesRes] = await Promise.all([
        supabase.from("companies").select("*").order("name"),
        supabase.from("company_roles").select("*"),
      ]);
      if (compRes.data) setCompanies(compRes.data);
      if (rolesRes.data) setRoles(rolesRes.data as CompanyRole[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedRoles = selectedCompany ? roles.filter((r) => r.company_id === selectedCompany) : [];
  const selectedComp = companies.find((c) => c.id === selectedCompany);

  const skillLabels: Record<string, string> = {
    programming: "Programming",
    aptitude: "Aptitude",
    database: "Database",
    web_development: "Web Dev",
    logical_thinking: "Logic",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Requirements</h1>
        <p className="text-muted-foreground">Browse companies and their role requirements</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Company List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No companies found</p>
                </CardContent>
              </Card>
            ) : (
              filtered.map((c) => (
                <Card
                  key={c.id}
                  className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.98] ${
                    selectedCompany === c.id ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedCompany(c.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.industry || "Technology"} · {roles.filter((r) => r.company_id === c.id).length} roles
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Role Details */}
          <div>
            {selectedComp ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedComp.name}</h2>
                  {selectedComp.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedComp.description}</p>
                  )}
                </div>
                {selectedRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roles listed yet.</p>
                ) : (
                  selectedRoles.map((role) => (
                    <Card key={role.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Briefcase className="h-4 w-4 text-primary" />
                          {role.title}
                        </CardTitle>
                        {role.experience_level && (
                          <CardDescription>{role.experience_level}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {role.description && (
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        )}
                        <div>
                          <p className="text-xs font-medium mb-1.5">Required Skills</p>
                          <div className="space-y-1.5">
                            {Object.entries(role.required_skills).map(([skill, level]) => (
                              <div key={skill} className="flex items-center gap-2">
                                <span className="text-xs w-20 truncate">{skillLabels[skill] || skill}</span>
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${level}%` }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{level}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {role.qualifications && role.qualifications.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {role.qualifications.map((q, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{q}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <Building2 className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Select a company to view roles</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
