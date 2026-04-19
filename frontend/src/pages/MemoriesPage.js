import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import axios from 'axios';
import {
  Terminal,
  Brain,
  Plus,
  Folder,
  LogOut,
  Trash2,
  Edit2,
  Check,
  X,
  Zap,
  Database,
  Code2,
  Settings,
  Search
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES = [
  { value: 'general', label: 'General', icon: Brain },
  { value: 'coding', label: 'Coding Patterns', icon: Code2 },
  { value: 'preferences', label: 'Preferences', icon: Settings },
  { value: 'context', label: 'Project Context', icon: Database },
  { value: 'rules', label: 'Rules & Guidelines', icon: Zap }
];

const MemoriesPage = () => {
  const { user, token, logout } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/core-memories`, { headers });
      setMemories(response.data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMemory = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/core-memories`,
        { title, content, category },
        { headers }
      );
      setMemories([response.data, ...memories]);
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateMemory = async (memoryId, updates) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/core-memories/${memoryId}`,
        updates,
        { headers }
      );
      setMemories(memories.map(m => m.id === memoryId ? { ...m, ...response.data } : m));
    } catch (error) {
      console.error('Failed to update memory:', error);
    }
  };

  const deleteMemory = async (memoryId) => {
    if (!window.confirm('Delete this memory permanently?')) return;
    try {
      await axios.delete(`${API_URL}/api/core-memories/${memoryId}`, { headers });
      setMemories(memories.filter(m => m.id !== memoryId));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const toggleMemoryActive = async (memory) => {
    await updateMemory(memory.id, { is_active: !memory.is_active });
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setEditingMemory(null);
  };

  const openEditDialog = (memory) => {
    setEditingMemory(memory);
    setTitle(memory.title);
    setContent(memory.content);
    setCategory(memory.category);
    setDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingMemory) {
      await createMemory();
    } else {
      setSaving(true);
      try {
        await updateMemory(editingMemory.id, { title, content, category });
        resetForm();
        setDialogOpen(false);
      } catch (error) {
        console.error('Failed to update:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const filteredMemories = memories.filter((m) => {
  const title = (m?.title || "").toLowerCase();
  const content = (m?.content || "").toLowerCase();

  const matchesSearch =
    title.includes(searchTerm.toLowerCase()) ||
    content.includes(searchTerm.toLowerCase());

  const matchesCategory =
    filterCategory === "all" || m?.category === filterCategory;

  return matchesSearch && matchesCategory;
});

  const getCategoryIcon = (cat) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? found.icon : Brain;
  };

  const stats = {
    total: memories.length,
    active: memories.filter(m => m.is_active).length
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
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-[#00FF41] hover:bg-zinc-900 transition-colors"
            data-testid="nav-projects"
          >
            <Folder className="w-5 h-5" />
            <span className="font-mono text-sm">PROJECTS</span>
          </Link>
          
          <Link
            to="/memories"
            className="flex items-center gap-3 px-4 py-3 bg-[#00FF41]/10 border-l-2 border-[#00FF41] text-[#00FF41]"
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
            onClick={logout}
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
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
          <div className="border border-[#00FF41]/20 bg-[#0A0A0A] p-6 scanlines relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-zinc-500 text-xs tracking-wider uppercase mb-2 font-mono">TOTAL MEMORIES</p>
              <p className="text-3xl font-['Outfit'] font-bold text-[#00FF41]">{stats.total}</p>
            </div>
          </div>
          <div className="border border-[#00FF41]/20 bg-[#0A0A0A] p-6 scanlines relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-zinc-500 text-xs tracking-wider uppercase mb-2 font-mono">ACTIVE MEMORIES</p>
              <p className="text-3xl font-['Outfit'] font-bold text-[#00FF41]">{stats.active}</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-['Outfit'] text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="w-7 h-7 text-[#00FF41]" />
              CORE BRAIN MEMORY
            </h1>
            <p className="text-zinc-500 font-mono text-sm mt-1">
              Permanent knowledge that persists across all chats
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                data-testid="create-memory-button"
                className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW MEMORY
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0A0A] border border-[#00FF41]/30 rounded-none max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-['Outfit'] text-white">
                  {editingMemory ? 'EDIT MEMORY' : 'CREATE NEW MEMORY'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block font-mono">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Preferred React patterns"
                    data-testid="memory-title-input"
                    className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block font-mono">
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger 
                      className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41]"
                      data-testid="memory-category-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-zinc-800 rounded-none">
                      {CATEGORIES.map(cat => (
                        <SelectItem 
                          key={cat.value} 
                          value={cat.value}
                          className="text-zinc-300 focus:bg-[#00FF41]/10 focus:text-[#00FF41]"
                        >
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs tracking-wider uppercase mb-2 block font-mono">
                    Content
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe the knowledge you want CodeBrain to remember..."
                    rows={6}
                    data-testid="memory-content-input"
                    className="bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] font-mono resize-none"
                  />
                </div>
                <Button
                  onClick={saveEdit}
                  disabled={saving || !title.trim() || !content.trim()}
                  data-testid="save-memory-button"
                  className="w-full bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
                >
                  {saving ? 'SAVING...' : (editingMemory ? 'UPDATE MEMORY' : 'CREATE MEMORY')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search memories..."
              data-testid="search-memories-input"
              className="pl-10 bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41] font-mono"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger 
              className="w-48 bg-[#050505] border-zinc-800 text-white rounded-none focus:border-[#00FF41]"
              data-testid="filter-category-select"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0A0A] border-zinc-800 rounded-none">
              <SelectItem value="all" className="text-zinc-300 focus:bg-[#00FF41]/10 focus:text-[#00FF41]">
                All Categories
              </SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem 
                  key={cat.value} 
                  value={cat.value}
                  className="text-zinc-300 focus:bg-[#00FF41]/10 focus:text-[#00FF41]"
                >
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Memories List */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-[#00FF41] font-mono animate-pulse">LOADING MEMORIES<span className="cursor-blink">█</span></p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="border border-dashed border-zinc-800 p-12 text-center">
            <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 font-mono mb-4">
              {memories.length === 0 ? 'No memories yet' : 'No memories match your search'}
            </p>
            {memories.length === 0 && (
              <Button
                onClick={() => setDialogOpen(true)}
                data-testid="empty-create-memory-button"
                className="bg-[#00FF41] text-black font-bold uppercase tracking-wider hover:bg-[#00D632] rounded-none"
              >
                CREATE YOUR FIRST MEMORY
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMemories.map((memory) => {
              const CategoryIcon = getCategoryIcon(memory.category);
              return (
                <div
                  key={memory.id}
                  className={`border ${memory.is_active ? 'border-[#00FF41]/30' : 'border-zinc-800'} bg-[#0A0A0A] p-6 group hover:border-[#00FF41]/50 transition-colors`}
                  data-testid={`memory-card-${memory.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CategoryIcon className={`w-5 h-5 ${memory.is_active ? 'text-[#00FF41]' : 'text-zinc-500'}`} />
                        <h3 className="font-['Outfit'] text-lg font-semibold text-white">{memory.title}</h3>
                        <span className="text-zinc-600 text-xs font-mono uppercase px-2 py-1 border border-zinc-800">
                          {memory.category}
                        </span>
                      </div>
                      <p className="text-zinc-400 font-mono text-sm mb-4 whitespace-pre-wrap line-clamp-3">
                        {memory.content}
                      </p>
                      <div className="flex items-center gap-4 text-zinc-600 text-xs font-mono">
                        <span>{new Date(memory.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs font-mono">
                          {memory.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <Switch
                          checked={memory.is_active}
                          onCheckedChange={() => toggleMemoryActive(memory)}
                          data-testid={`toggle-memory-${memory.id}`}
                          className="data-[state=checked]:bg-[#00FF41]"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(memory)}
                        data-testid={`edit-memory-${memory.id}`}
                        className="text-zinc-500 hover:text-[#00FF41] hover:bg-[#00FF41]/10 rounded-none"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMemory(memory.id)}
                        data-testid={`delete-memory-${memory.id}`}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MemoriesPage;
