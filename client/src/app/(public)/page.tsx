import Link from "next/link";
import { ArrowRight, Cpu, Shield, Zap, MessageSquare, Database, BarChart2, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Project Pilot - Premium Full-Stack Boilerplate",
  description: "Accelerate your development with a robust, production-ready stack utilizing Next.js, Express, PostgreSQL, Prisma, JWT, Socket.io, and Recharts.",
};

export default function Home() {
  const features = [
    {
      icon: <Cpu className="h-6 w-6 text-primary" />,
      title: "Next.js & Express",
      description: "A premium split-architecture monorepo separating React client app from a fast Express.js backend API."
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-500" />,
      title: "JWT Authentication",
      description: "Fully-secure token system featuring HTTP-only access and refresh cookies, role verification, and password hashing."
    },
    {
      icon: <Database className="h-6 w-6 text-blue-500" />,
      title: "PostgreSQL & Prisma ORM",
      description: "Modern schema architecture leveraging Prisma ORM, migrations, and connection-pooled PostgreSQL backend."
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-emerald-500" />,
      title: "Recharts Visualization",
      description: "Interactive dashboard metrics built using premium, responsive Recharts charts that match any theme."
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-purple-500" />,
      title: "Real-time Socket.io",
      description: "Bi-directional WebSocket connection with JWT middleware authentication and dynamic notification listeners."
    },
    {
      icon: <HardDrive className="h-6 w-6 text-orange-500" />,
      title: "Multer & Cloudinary",
      description: "Clean file upload pipeline to upload avatar and attachments securely onto Cloudinary CDN servers."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 animate-fade-in">
          <Zap className="h-3.5 w-3.5 fill-current" />
          Production-Ready Boilerplate Stack
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Launch Your Next Idea Instantly with{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
            Project Pilot
          </span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl font-light">
          A premium template pre-configured with Next.js, Express, PostgreSQL, Prisma, JWT, Socket.io, and Recharts. Designed for speed, security, and developer joy.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <Button asChild size="lg" className="w-full sm:w-auto h-12 rounded-xl text-md px-8 font-semibold">
            <Link href="/login">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 rounded-xl text-md px-8 border-border bg-card hover:bg-accent">
            <Link href="/register">
              Create Account
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border bg-muted/5 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">The Foundational Core Stack</h2>
            <p className="mt-4 text-muted-foreground font-light max-w-md mx-auto">
              We did the boring configuration and plumbing so you can focus on building features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="mb-4 p-3 rounded-xl bg-accent w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-card text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-light">
          <div>
            © {new Date().getFullYear()} Project Pilot. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
