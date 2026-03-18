import { BookMarked } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/Navigation";
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  GraduationCap,
  Atom,
  FlaskConical,
  Dna,
  Leaf,
  Activity,
  Microscope,
  Zap,
  TestTube2,
  Beaker
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Icon mapping for NEET subjects
const subjectIcons: Record<string, any> = {
  "Physics": Atom,
  "Chemistry": FlaskConical,
  "Biology": Dna,
  "Biology - Botany": Leaf,
  "Biology - Zoology": Activity,
  "Botany": Leaf,
  "Zoology": Activity,
  // Additional common variations
  "Physical Chemistry": Beaker,
  "Organic Chemistry": TestTube2,
  "Inorganic Chemistry": FlaskConical,
  "Mechanics": Zap,
  "Thermodynamics": Atom,
  "Optics": Atom,
  "Electromagnetism": Zap,
  "Plant Physiology": Leaf,
  "Cell Biology": Microscope,
  "Genetics": Dna,
  "Human Physiology": Activity,
  "Ecology": Leaf,
  "Evolution": Dna,
};

const subjectColors: Record<string, string> = {
  "Physics": "from-blue-500 to-indigo-600",
  "Chemistry": "from-purple-500 to-pink-600",
  "Biology": "from-green-500 to-emerald-600",
  "Biology - Botany": "from-green-500 to-teal-600",
  "Biology - Zoology": "from-emerald-500 to-green-600",
  "Botany": "from-green-500 to-teal-600",
  "Zoology": "from-emerald-500 to-green-600",
  // Additional common variations
  "Physical Chemistry": "from-purple-400 to-purple-600",
  "Organic Chemistry": "from-pink-500 to-purple-600",
  "Inorganic Chemistry": "from-purple-600 to-indigo-600",
  "Mechanics": "from-blue-400 to-blue-600",
  "Thermodynamics": "from-blue-500 to-indigo-500",
  "Optics": "from-indigo-400 to-blue-500",
  "Electromagnetism": "from-blue-600 to-indigo-600",
  "Plant Physiology": "from-green-400 to-teal-500",
  "Cell Biology": "from-teal-500 to-green-500",
  "Genetics": "from-green-600 to-emerald-600",
  "Human Physiology": "from-emerald-400 to-green-500",
  "Ecology": "from-green-500 to-lime-600",
  "Evolution": "from-emerald-600 to-teal-600",
};

export default async function SubjectsPage() {
  const supabase = await createSupabaseServerClient();

  // Get current session (more reliable than getUser for SSR)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { data: subjects } = await supabase
    .from("syllabus_subjects")
    .select("id,name,order")
    .order("order", { ascending: true});

  return (
    <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
      <Navigation />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-12 text-center">
        <Badge className="mb-4 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-950/70 dark:border-blue-800 flex items-center gap-1.5 mx-auto w-fit">
          <GraduationCap className="h-3.5 w-3.5" />
          NEET UG Syllabus
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Browse Subjects</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Select a subject to explore topics and generate AI-powered study notes
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(subjects ?? []).map((subject) => {
          const Icon = subjectIcons[subject.name] || BookOpen;
          const colorGradient = subjectColors[subject.name] || "from-slate-500 to-slate-600";
          
          return (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="group relative rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 shadow-sm dark:shadow-slate-900/50 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorGradient} opacity-10 dark:opacity-20 rounded-bl-[100px]`} />
              
              <div className="relative">
                <div className={`mb-4 p-3 rounded-xl bg-gradient-to-br ${colorGradient} w-fit group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {subject.name}
                </h3>
                
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <Sparkles className="h-4 w-4" />
                  <span>Start Learning</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(!subjects || subjects.length === 0) && (
        <div className="text-center py-16">
          <div className="mx-auto w-fit p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
            <BookMarked className="h-12 w-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No subjects available yet</h3>
          <p className="text-slate-600 dark:text-slate-300">Please contact your administrator to add subjects to the syllabus.</p>
        </div>
      )}
      </div>
    </div>
  );
}
