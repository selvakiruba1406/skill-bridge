import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Code,
  Brain,
  Database,
  Globe,
  Lightbulb,
  Clock,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

type Category = "programming" | "aptitude" | "database" | "web_development" | "logical_thinking";
type Phase = "select" | "test" | "result";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  marks: number;
}

const categoryConfig: Record<Category, { label: string; icon: any; color: string }> = {
  programming: { label: "Programming", icon: Code, color: "bg-primary/10 text-primary" },
  aptitude: { label: "Aptitude", icon: Brain, color: "bg-secondary/20 text-secondary-foreground" },
  database: { label: "Database", icon: Database, color: "bg-accent/10 text-accent" },
  web_development: { label: "Web Development", icon: Globe, color: "bg-destructive/10 text-destructive" },
  logical_thinking: { label: "Logical Thinking", icon: Lightbulb, color: "bg-muted text-foreground" },
};

const TIMER_MINUTES = 30;

const TakeTest = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(TIMER_MINUTES * 60);
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [loading, setLoading] = useState(false);

  const submitTest = useCallback(async () => {
    if (!user || !selectedCategory) return;
    let earned = 0;
    let total = 0;
    questions.forEach((q) => {
      total += q.marks;
      if (answers[q.id] === q.correct_answer) earned += q.marks;
    });

    setScore(earned);
    setTotalMarks(total);
    setPhase("result");

    await supabase.from("skill_tests").insert({
      user_id: user.id,
      category: selectedCategory,
      score: earned,
      total_marks: total,
      answers,
    });
  }, [user, selectedCategory, questions, answers]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    if (timeLeft <= 0) {
      toast.info("Time's up! Auto-submitting your test.");
      submitTest();
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, submitTest]);

  const startTest = async (cat: Category) => {
    setLoading(true);
    setSelectedCategory(cat);
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_text, options, correct_answer, marks")
      .eq("category", cat)
      .limit(50);

    if (error || !data?.length) {
      toast.error("No questions available for this category yet.");
      setLoading(false);
      return;
    }

    // Shuffle and take up to 50
    const shuffled = data
      .map((q) => ({ ...q, options: q.options as string[] }))
      .sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(TIMER_MINUTES * 60);
    setPhase("test");
    setLoading(false);
  };

  const selectAnswer = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Category selection
  if (phase === "select") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Take a Skill Test</h1>
          <p className="text-muted-foreground">Choose a category to test your knowledge (50 marks, 30 min)</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(categoryConfig) as [Category, typeof categoryConfig[Category]][]).map(
            ([key, config]) => (
              <Card
                key={key}
                className="group cursor-pointer transition-all hover:shadow-md active:scale-[0.97]"
                onClick={() => startTest(key)}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-xl p-3 ${config.color} transition-transform group-hover:scale-110`}>
                    <config.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">50 marks · 30 min</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            )
          )}
        </div>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    );
  }

  // Result
  if (phase === "result") {
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Test Complete!</CardTitle>
            <CardDescription>
              {categoryConfig[selectedCategory!]?.label} — {questions.length} questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-5xl font-bold tabular-nums text-primary">{pct}%</p>
              <p className="text-muted-foreground">
                {score} / {totalMarks} marks
              </p>
            </div>
            <Progress value={pct} className="h-3" />
            <div className="flex gap-3">
              <Button onClick={() => setPhase("select")} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button onClick={() => startTest(selectedCategory!)} className="flex-1">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test in progress
  const q = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">{categoryConfig[selectedCategory!]?.label}</Badge>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={`tabular-nums font-medium ${timeLeft < 60 ? "text-destructive" : ""}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {answeredCount}/{questions.length} answered
      </p>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardDescription>Question {currentIndex + 1} of {questions.length}</CardDescription>
          <CardTitle className="text-lg leading-relaxed">{q.question_text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(q.options as string[]).map((opt, idx) => {
            const selected = answers[q.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => selectAnswer(q.id, idx)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all active:scale-[0.98] ${
                  selected
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((p) => p - 1)}
          className="flex-1"
        >
          Previous
        </Button>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((p) => p + 1)} className="flex-1">
            Next
          </Button>
        ) : (
          <Button onClick={submitTest} className="flex-1">
            Submit Test
          </Button>
        )}
      </div>
    </div>
  );
};

export default TakeTest;
