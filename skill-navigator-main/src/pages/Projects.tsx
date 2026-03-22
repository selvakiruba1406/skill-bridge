import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, FolderKanban, Upload } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[] | null;
  project_url: string | null;
  github_url: string | null;
  created_at: string;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setProjects(data);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const handleSave = async () => {
    if (!user || !title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);

    const { data: proj, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        tech_stack: techStack ? techStack.split(",").map((s) => s.trim()).filter(Boolean) : null,
        project_url: projectUrl.trim() || null,
        github_url: githubUrl.trim() || null,
      })
      .select()
      .single();

    if (error) { toast.error(error.message); setSaving(false); return; }

    // Upload files
    for (const file of files) {
      const filePath = `${user.id}/${proj.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("project-files").upload(filePath, file);
      if (upErr) { console.error(upErr); continue; }
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath);
      await supabase.from("project_files").insert({
        project_id: proj.id,
        user_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
    }

    toast.success("Project added!");
    setDialogOpen(false);
    resetForm();
    fetchProjects();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Project deleted");
    fetchProjects();
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setTechStack("");
    setProjectUrl(""); setGithubUrl(""); setFiles([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Showcase your work</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Project</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Project" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this project do?" rows={3} />
              </div>
              <div>
                <Label>Tech Stack (comma-separated)</Label>
                <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="React, Node.js, PostgreSQL" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Live URL</Label>
                  <Input value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>GitHub URL</Label>
                  <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                </div>
              </div>
              <div>
                <Label>Files (PDF, DOCX, images)</Label>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No projects yet. Add your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {p.description && <CardDescription className="line-clamp-2">{p.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                {p.tech_stack && p.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tech_stack.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {p.project_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={p.project_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" /> Live
                      </a>
                    </Button>
                  )}
                  {p.github_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={p.github_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 h-3 w-3" /> GitHub
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
