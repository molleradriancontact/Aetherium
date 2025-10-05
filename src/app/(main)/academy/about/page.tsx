
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Code, Presentation, Rocket, MessageSquare, FileUp, FolderKanban, Search, WandSparkles, Bot, Image as ImageIcon, Video } from "lucide-react";

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

const accessPoints = [
    {
        icon: MessageSquare,
        title: "AI Assistant Chat (/prototype)",
        description: "Brainstorm ideas and flesh out concepts. This initial conversation can be saved as a document to kickstart a full analysis project."
    },
    {
        icon: FileUp,
        title: "File Upload & Analysis (/prototype)",
        description: "Provide the AI with data by uploading documents, code, or design files. The AI performs a deep analysis and generates a comprehensive report."
    },
    {
        icon: FolderKanban,
        title: "Project Chat (Homepage)",
        description: "Once a project is active, ask the AI context-aware questions about the analysis report and codebase on the main dashboard."
    },
    {
        icon: Search,
        title: "Deep Research Chat (/research)",
        description: "A standalone tool for general-purpose research. The AI uses web search to answer any question, independent of a specific project."
    },
    {
        icon: Bot,
        title: "Suggestion Generation (/frontend & /backend)",
        description: "Command the AI to analyze the project report and propose high-level architectural and structural changes for the frontend or backend."
    },
    {
        icon: WandSparkles,
        title: "Code Prototyping (/frontend & /backend)",
        description: "Instruct the AI to write and modify actual application files based on its analysis, generating a tangible code prototype you can review."
    },
    {
        icon: ImageIcon,
        title: "Generative Media Creation (/generative-media)",
        description: "Use text prompts to generate unique images and videos with AI, perfect for creating marketing assets, blog headers, or social media content."
    },
    {
        icon: Video,
        title: "Media Studio Modification (/studio)",
        description: "Upload an existing video and provide the AI with text prompts to modify its style, color, or add effects, repurposing content with ease."
    }
];


export default function AboutPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="About Aetherium"
        subtitle="Understanding the users we are built for and how our AI works."
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

      <Card>
        <CardHeader>
          <CardTitle>AI Interaction Points</CardTitle>
          <CardDescription>
            The application provides several distinct access points to interact with the Gemini-powered AI, each tailored for a specific task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessPoints.map((point, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <point.icon className="h-8 w-8 text-primary flex-shrink-0" />
                        <CardTitle className="text-base">{point.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">
                    {point.description}
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
