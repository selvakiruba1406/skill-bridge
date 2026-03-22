import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Download, RefreshCw } from "lucide-react";

interface ResumeFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  is_active: boolean;
  created_at: string;
}

const Resume = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<ResumeFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResumes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setResumes(data);
    setLoading(false);
  };

  useEffect(() => { fetchResumes(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload PDF, DOCX, or image files only.");
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);

    await supabase.from("resumes").insert({
      user_id: user.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
    });

    toast.success("Resume uploaded!");
    await fetchResumes();
    setUploading(false);
  };

  const handleDelete = async (resume: ResumeFile) => {
    const pathParts = resume.file_url.split("/resumes/");
    const storagePath = pathParts[pathParts.length - 1];
    
    await supabase.storage.from("resumes").remove([storagePath]);
    await supabase.from("resumes").delete().eq("id", resume.id);
    toast.success("Resume deleted");
    fetchResumes();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume</h1>
          <p className="text-muted-foreground">Upload and manage your resume</p>
        </div>
        <label>
          <Input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button asChild disabled={uploading}>
            <span className="cursor-pointer">
              {uploading ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> Upload Resume</>
              )}
            </span>
          </Button>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      ) : resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No resumes uploaded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(r.file_size)} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Resume;
