
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Code, Presentation, Rocket } from "lucide-react";

const personas = [
  {
    icon: Briefcase,
    title: "The Software Architect / Tech Lead",
    description: "The core user who needs to design, validate, and improve system architectures. They upload existing codebases or design documents to get deep analysis, identify code smells, and rapidly prototype new architectural approaches for both frontend and backend systems."
  },
  {
    icon: Code,
    title: "The Full-Stack Developer",
    description: "A hands-on developer looking for an AI partner to accelerate their workflow. They use the app to refactor components, generate boilerplate code from business logic, and get intelligent suggestions to solve implementation challenges."
  },
  {
    icon: Presentation,
    title: "The Product Manager / Designer",
    description: "A less technical user focused on features and user experience. They can upload design mockups, user stories, or requirement documents. The AI helps bridge the gap between vision and engineering by generating high-level plans and even clickable UI prototypes."
  },
  {
    icon: Rocket,
    title: "The Innovator / Entrepreneur",
    description: "A user with a great idea but limited technical resources. They use the application to quickly transform a business plan or a collection of notes into a tangible prototype, helping them to validate their concept and secure funding without a large upfront development investment."
  }
];

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="About Aetherium"
        subtitle="Understanding the users we are built for."
      />

      <Card>
        <CardHeader>
          <CardTitle>Who is Aetherium For?</CardTitle>
          <CardDescription>
            Aetherium is designed for technical professionals and creators who want to accelerate the software development lifecycle. Our target users are builders who see AI as a powerful partner in the creative process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personas.map((persona, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader className="flex flex-row items-start gap-4">
                  <persona.icon className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <CardTitle className="text-lg">{persona.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {persona.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
