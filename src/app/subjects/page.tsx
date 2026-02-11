import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/Navigation";
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  GraduationCap,
  FlaskConical,
  Pill,
  TestTube2,
  Microscope,
  Beaker,
  Dna,
  BookMarked,
  Atom,
  Factory,
  ShieldCheck,
  Syringe,
  Stethoscope,
  BookText,
  TestTubeDiagonal,
  Scale
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Icon mapping for different subjects - ALL UNIQUE PROFESSIONAL ICONS
const subjectIcons: Record<string, any> = {
  "Physical Chemistry": FlaskConical,
  "Medicinal Chemistry": Pill,
  "Pharmaceutical Analysis": Beaker,
  "Physical Pharmacy": Microscope,
  "Pharmaceutics": TestTube2,
  "Organic Chemistry": Atom,
  "Pharmacology": Pill,
  "Pharmaceutical Chemistry": Dna,
  "Human Anatomy and Physiology": Stethoscope,
  "Pharmaceutical Organic Chemistry": Atom,
  "Pharmaceutical Inorganic Chemistry": Beaker,
  "Pharmacognosy": FlaskConical,
  "Pathophysiology": Stethoscope,
  "Biochemistry": Dna,
  "Microbiology": Microscope,
  "Industrial Pharmacy": Factory,
  "Quality Assurance": ShieldCheck,
  "Biopharmaceutics and Pharmacokinetics": Syringe,
  "Novel Drug Delivery Systems": TestTubeDiagonal,
  "Instrumental Methods of Analysis": TestTube2,
  "Pharmacy Practice and Jurisprudence": Scale,
  "Pharmaceutical Biotechnology": Dna,
  "Clinical Pharmacy": Stethoscope,
  "Hospital Pharmacy": BookText,
  "Community Pharmacy": BookOpen,
  "Pharmaceutical Regulatory Science": Scale,
  "Biostatistics and Research Methodology": TestTube2,
  "Pharmacovigilance": ShieldCheck,
  "Cosmetic Science": Beaker,
  "Herbal Drug Technology": FlaskConical,
  "Computer Aided Drug Design": Microscope,
  "Social and Preventive Pharmacy": Stethoscope,
  "Experimental Pharmacology": TestTubeDiagonal,
};

const subjectColors: Record<string, string> = {
  "Physical Chemistry": "from-sky-400 to-sky-500",
  "Medicinal Chemistry": "from-sky-500 to-cyan-500",
  "Pharmaceutical Analysis": "from-sky-400 to-blue-500",
  "Physical Pharmacy": "from-cyan-400 to-sky-500",
  "Pharmaceutics": "from-sky-500 to-sky-600",
  "Organic Chemistry": "from-blue-400 to-sky-500",
  "Pharmacology": "from-sky-400 to-cyan-400",
  "Pharmaceutical Chemistry": "from-sky-500 to-blue-500",
  "Pharmaceutical Organic Chemistry": "from-blue-400 to-sky-400",
  "Pharmaceutical Inorganic Chemistry": "from-sky-500 to-slate-500",
  "Pharmacognosy": "from-cyan-400 to-sky-500",
  "Pathophysiology": "from-sky-400 to-blue-500",
  "Biochemistry": "from-blue-500 to-sky-600",
  "Microbiology": "from-sky-400 to-cyan-500",
  "Industrial Pharmacy": "from-slate-400 to-sky-500",
  "Quality Assurance": "from-sky-500 to-cyan-600",
  "Biopharmaceutics and Pharmacokinetics": "from-sky-500 to-blue-600",
  "Novel Drug Delivery Systems": "from-sky-400 to-blue-500",
  "Instrumental Methods of Analysis": "from-cyan-500 to-sky-500",
  "Pharmacy Practice and Jurisprudence": "from-slate-500 to-sky-600",
  "Pharmaceutical Biotechnology": "from-sky-400 to-cyan-500",
  "Clinical Pharmacy": "from-sky-500 to-blue-500",
  "Hospital Pharmacy": "from-sky-500 to-blue-600",
  "Community Pharmacy": "from-cyan-500 to-sky-600",
  "Pharmaceutical Regulatory Science": "from-sky-400 to-blue-500",
  "Biostatistics and Research Methodology": "from-sky-500 to-cyan-500",
  "Pharmacovigilance": "from-sky-400 to-sky-600",
  "Cosmetic Science": "from-sky-400 to-cyan-400",
  "Herbal Drug Technology": "from-cyan-400 to-sky-500",
  "Computer Aided Drug Design": "from-sky-500 to-blue-500",
  "Social and Preventive Pharmacy": "from-sky-400 to-cyan-500",
  "Experimental Pharmacology": "from-blue-400 to-sky-500",
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
    <div className="min-h-screen gradient-sky-radial dark:bg-slate-950">
      <Navigation />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-12 text-center">
        <Badge className="mb-4 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-950/70 dark:border-blue-800 flex items-center gap-1.5 mx-auto w-fit">
          <GraduationCap className="h-3.5 w-3.5" />
          GPAT Syllabus
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
