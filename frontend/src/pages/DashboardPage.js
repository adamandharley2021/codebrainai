import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import axios from 'axios';
import {
  Terminal,
  Plus,
  Folder,
  Brain,
  LogOut,
  Trash2,
  MessageSquare,
  Clock,
  ChevronRight
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DashboardPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total_projects: 0, total_memories: 0, active_memories: 0 });
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/projects`, { headers }),
        axios.get(`${API_URL}/api/stats`, { headers })
      ]);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/projects`,
        { name: newProjectName, description: newProjectDesc },
        { headers }
      );
      setProjects([response.data, ...projects]);
      setNewProjectName('');
      setNewProjectDesc('');
      setDialogOpen(false);
      setStats(prev => ({ ...prev, total_projects: prev.total_projects + 1 }));
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project and all its data?')) return;
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}`, { headers });
      setProjects(projects.filter(p => p.id !== projectId));
      setStats(prev => ({ ...prev, total_projects: prev.total_projects - 1 }));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#030303] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#00FF41] flex items-center justify-center">
              <Terminal className="w-5 h-5 text-[#00FF41]" />
            </div>
            <span className="font-['Outfit'] font-bold text-white">CODEBRAIN</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 bg-[#00FF41]/10 border-l-2 border-[#00FF41] text-[#00FF41]"
            data-testid="nav-projects"
          >
            <Folder className="w-5 h-5" />
            <span className="font-mono text-sm">PROJECTS</span>
          </Link>
          
          <Link
            to="/memories"
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-[#00FF41] hover:bg-zinc-900 transition-colors"
            data-testid="nav-memories"
          >
            <Brain className="w-5 h-5" />
            <span className="font-mono text-sm">CORE BRAIN</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="mb-4 px-2">
            <p className="text-zinc-500 text-xs font-mono truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            data-testid="logout-button"
            className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-none"
          >
            <LogOut className="w-4 h-4 mr-2" />
            LOGOUT
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-[#00FF41]/20 bg-[#0A0A0A] p-6" data-testid="stat-projects">
            <p className="text-zinc-500 text-xs tracking-wider uppercase mb-2 font-mono">PROJECTS</p>
            <p className="text-3xl font-['Outfit'] font-bold text-[#00FF41]">{stats.total_projects}</p>
          </div>
          <div className="border border-[#00FF41]/20 bg-[#0A0A0A] p-6" data-testid="stat-memories">
            <p className="text-zinc-500 text-xs tracking-wider uppercase mb-2 font-mono">TOTAL MEMORIES</p>
            <p className="text-3xl font-['Outfit'] font-bold text-[#00FF41]">{stats.total_memories}</p>
          </div>
          <div className="border border-[#00FF41]/20 bg-[#0A0A0A] p-6" data-testid="stat-active">
            <p className="text-zinc-500 text-xs tracking-wider uppercase mb-2 font-mono">ACTIVE MEMORIES</p>
            <p className="text-3xl font-['Outfit'] font-bold text-[#00FF41]">{stats.active_memories}</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-['Outfit'] text-2xl font-bold text-white">PROJECTS</h1>
            <p className="text-zinc-500 font-mono text-sm mt-1">Manage your code repositories</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="create-project-button"
                className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW PROJECT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border border-[#00FF41]/30 rounded-none">
              <DialogHeader>
                <DialogTitle className="font-['Outfit'] text-white">CREATE NEW PROJECT</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block font-mono">
                    Project Name
                  </label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="my-awesome-app"
                    data-testid="project-name-input"
                    className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block font-mono">
                    Description (Optional)
                  </label>
                  <Input
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="A brief description..."
                    data-testid="project-desc-input"
                    className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] font-mono"
                  />
                </div>
                <Button
                  onClick={createProject}
                  disabled={creating || !newProjectName.trim()}
                  data-testid="submit-project-button"
                  className="w-full bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
                >
                  {creating ? 'CREATING...' : 'CREATE PROJECT'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#00FF41] font-mono animate-pulse">LOADING PROJECTS<span className="cursor-blink">█</span></p>
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-12 text-center">
            <Folder className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-mono mb-4">No projects yet</p>
            <Button
              onClick={() => setDialogOpen(true)}
              data-testid="empty-create-button"
              className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
            >
              CREATE YOUR FIRST PROJECT
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-zinc-800 bg-[#0A0A0A] p-6 group hover:border-[#00FF41]/50 transition-colors"
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Folder className="w-5 h-5 text-[#00FF41]" />
                      <h3 className="font-['Outfit'] text-lg font-semibold text-white">{project.name}</h3>
                    </div>
                    {project.description && (
                      <p className="text-zinc-500 font-mono text-sm mb-4">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-zinc-600 text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                      data-testid={`delete-project-${project.id}`}
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Link to={`/project/${project.id}`}>
                      <Button
                        data-testid={`open-project-${project.id}`}
                        className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        OPEN CHAT
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
