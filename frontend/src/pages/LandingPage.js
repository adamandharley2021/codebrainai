import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import MatrixRain from '../components/MatrixRain';
import { 
  Terminal, 
  Brain, 
  Code2, 
  Upload, 
  MessageSquare, 
  Zap,
  Shield,
  GitBranch,
  ChevronRight
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'CORE BRAIN MEMORY',
      description: 'Persistent memory that never forgets. Train your AI assistant with knowledge that persists across all sessions.',
      span: 'col-span-2'
    },
    {
      icon: Code2,
      title: 'FULL CODE GENERATION',
      description: 'Get complete, working code files. Not snippets - entire solutions ready to deploy.',
      span: 'col-span-1'
    },
    {
      icon: Upload,
      title: 'PROJECT UPLOAD',
      description: 'Upload your entire project. The AI analyzes your codebase for context-aware assistance.',
      span: 'col-span-1'
    },
    {
      icon: MessageSquare,
      title: 'STREAMING CHAT',
      description: 'Real-time streaming responses. Watch the AI think and code in real-time.',
      span: 'col-span-1'
    },
    {
      icon: Zap,
      title: 'GPT-4o POWERED',
      description: 'Backed by OpenAI\'s latest models for cutting-edge code intelligence.',
      span: 'col-span-1'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      <MatrixRain />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#00FF41] flex items-center justify-center">
              <Terminal className="w-5 h-5 text-[#00FF41]" />
            </div>
            <span className="font-['Outfit'] font-bold text-white text-lg tracking-tight">CODEBRAIN</span>
          </div>
          
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button 
                  data-testid="dashboard-nav-button"
                  className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none px-6"
                >
                  ENTER DASHBOARD
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    data-testid="login-nav-button"
                    className="text-zinc-400 hover:text-[#00FF41] hover:bg-zinc-900 rounded-none"
                  >
                    LOGIN
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    data-testid="register-nav-button"
                    className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none px-6"
                  >
                    GET STARTED
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <span className="text-[#00FF41] text-xs tracking-[0.3em] uppercase font-mono border border-[#00FF41]/30 px-4 py-2 inline-block">
              AI-POWERED CODE INTELLIGENCE
            </span>
          </div>
          
          <h1 className="font-['Outfit'] text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
            YOUR PERSONAL
            <br />
            <span className="text-[#00FF41] glow-text">CODE DEBUGGER</span>
            <br />
            <span className="text-zinc-400">WITH MEMORY</span>
          </h1>
          
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10 font-mono leading-relaxed">
            Upload your projects. Chat with AI that understands your code. 
            Get complete file fixes and upgrades. Never explain your codebase twice.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              <Button 
                data-testid="hero-cta-button"
                className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none h-14 px-10 text-lg matrix-btn"
              >
                {isAuthenticated ? 'GO TO DASHBOARD' : 'START DEBUGGING'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button 
                variant="outline"
                className="border border-[#00FF41] text-[#00FF41] bg-transparent hover:bg-[#00FF41]/10 rounded-none h-14 px-10"
              >
                LEARN MORE
              </Button>
            </a>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-zinc-500 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00FF41]" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#00FF41]" />
              <span>Project-Specific</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#00FF41]" />
              <span>Never Forgets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#00FF41] text-xs tracking-[0.3em] uppercase font-mono">CAPABILITIES</span>
            <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold text-white mt-4">
              SYSTEM FEATURES
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#00FF41]/20">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-[#050505] p-8 group hover:bg-[#0A0A0A] transition-colors ${feature.span || ''}`}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 border border-[#00FF41]/50 flex items-center justify-center mb-6 group-hover:border-[#00FF41] transition-colors">
                  <feature.icon className="w-6 h-6 text-[#00FF41]" />
                </div>
                <h3 className="font-['Outfit'] text-lg font-semibold text-white mb-3 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 border-t border-[#00FF41]/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Outfit'] text-3xl sm:text-4xl font-bold text-white mb-6">
            READY TO <span className="text-[#00FF41]">OPTIMIZE</span> YOUR CODE?
          </h2>
          <p className="text-zinc-400 font-mono mb-10">
            Join the matrix. Let AI remember and assist with your projects.
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/register"}>
            <Button 
              data-testid="cta-bottom-button"
              className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none h-14 px-12 text-lg matrix-btn"
            >
              {isAuthenticated ? 'ACCESS DASHBOARD' : 'INITIALIZE NOW'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-[#00FF41]" />
            <span className="text-zinc-500 font-mono text-sm">CODEBRAIN v1.0</span>
          </div>
          <p className="text-zinc-600 font-mono text-xs">
            Powered by OpenAI GPT-4o • Supabase
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
