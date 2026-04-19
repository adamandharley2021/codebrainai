import React, { useState, useEffect, useRef } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import {
  Terminal,
  Send,
  Upload,
  FileCode,
  Trash2,
  ArrowLeft,
  X,
  Brain,
  Folder,
  ChevronDown,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectChatPage = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showFiles, setShowFiles] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, filesRes, chatRes] = await Promise.all([
        axios.get(`${API_URL}/api/projects/${projectId}`, { headers }),
        axios.get(`${API_URL}/api/projects/${projectId}/files`, { headers }),
        axios.get(`${API_URL}/api/projects/${projectId}/chat`, { headers })
      ]);
      setProject(projectRes.data);
      setFiles(filesRes.data);
      setMessages(chatRes.data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadFiles = Array.from(e.target.files);
    if (uploadFiles.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(
          `${API_URL}/api/projects/${projectId}/files`,
          formData,
          { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
        );
        setFiles(prev => [...prev, { ...response.data, filename: file.name }]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}/files/${fileId}`, { headers });
      setFiles(files.filter(f => f.id !== fileId));
      if (selectedFile?.id === fileId) setSelectedFile(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const viewFile = async (file) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}/files/${file.id}`,
        { headers }
      );
      setSelectedFile(response.data);
    } catch (error) {
      console.error('Failed to fetch file:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    
    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setStreaming(true);
    
    // Add user message immediately
    const userMsg = { role: 'user', content: userMessage, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    
    // Add empty assistant message for streaming
    const assistantMsgId = Date.now();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', streaming: true }]);
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project_id: projectId, message: userMessage })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
              if (data.done) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, streaming: false, created_at: new Date().toISOString() }
                    : msg
                ));
              }
              if (data.error) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, content: `Error: ${data.error}`, streaming: false }
                    : msg
                ));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: 'Error: Failed to get response', streaming: false }
          : msg
      ));
    } finally {
      setSending(false);
      setStreaming(false);
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Clear all chat history?')) return;
    try {
      await axios.delete(`${API_URL}/api/projects/${projectId}/chat`, { headers });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const copyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    
    // Parse code blocks from content
    const parts = msg.content.split(/(```[\s\S]*?```)/g);
    
    return (
      <div
        key={msg.id || index}
        className={`mb-4 ${isUser ? 'flex justify-end' : ''}`}
        data-testid={`message-${index}`}
      >
        <div className={`max-w-[85%] ${isUser ? 'bg-[#00FF41]/10 border border-[#00FF41]/30' : 'bg-[#0A0A0A] border border-zinc-800'} p-4`}>
          <div className="flex items-center gap-2 mb-2">
            {isUser ? (
              <span className="text-[#00FF41] text-xs font-mono uppercase">YOU</span>
            ) : (
              <span className="text-zinc-400 text-xs font-mono uppercase flex items-center gap-1">
                <Brain className="w-3 h-3" /> CODEBRAIN
              </span>
            )}
          </div>
          
          <div className="text-zinc-200 font-mono text-sm leading-relaxed">
            {parts.map((part, i) => {
              if (part.startsWith('```')) {
                const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                if (match) {
                  const [, lang, code] = match;
                  const codeIndex = `${index}-${i}`;
                  return (
                    <div key={i} className="my-3 relative group">
                      <div className="absolute right-2 top-2 z-10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyCode(code.trim(), codeIndex)}
                          className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                        >
                          {copiedCode === codeIndex ? (
                            <Check className="w-4 h-4 text-[#00FF41]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <SyntaxHighlighter
                        language={lang || 'javascript'}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: 0,
                          background: '#0A0A0A',
                          border: '1px solid #27272A',
                          fontSize: '13px'
                        }}
                      >
                        {code.trim()}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
              }
              return <span key={i} className="whitespace-pre-wrap">{part}</span>;
            })}
            {msg.streaming && <span className="text-[#00FF41] cursor-blink">█</span>}
          </div>
        </div>
      </div>
    );
  };

  const getFileLanguage = (file) => {
  const path = file?.file_path || file?.filename || "";

  if (!path || typeof path !== "string") return "text";

  const parts = path.split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";

  const map = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
  };

  return map[ext] || "text";
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-[#00FF41] font-mono animate-pulse">LOADING PROJECT<span className="cursor-blink">█</span></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#030303] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-zinc-400 hover:text-[#00FF41]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#00FF41]" />
            <h1 className="font-['Outfit'] font-semibold text-white">{project?.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            data-testid="clear-chat-button"
            className="text-zinc-500 hover:text-red-400 rounded-none"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            CLEAR CHAT
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Files Sidebar */}
        <aside className={`${showFiles ? 'w-64' : 'w-0'} border-r border-white/10 bg-[#030303] flex flex-col transition-all overflow-hidden`}>
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-mono uppercase">PROJECT FILES</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-testid="upload-file-button"
              className="h-7 px-2 text-[#00FF41] hover:bg-[#00FF41]/10 rounded-none"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.cpp,.c,.cs,.html,.css,.scss,.json,.md,.yaml,.yml,.sql,.txt,.env,.gitignore"
            />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {files.length === 0 ? (
                <p className="text-zinc-600 text-xs font-mono text-center py-4">No files uploaded</p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 px-2 py-2 group hover:bg-zinc-900 cursor-pointer ${selectedFile?.id === file.id ? 'bg-[#00FF41]/10 border-l-2 border-[#00FF41]' : ''}`}
                    onClick={() => viewFile(file)}
                    data-testid={`file-${file.id}`}
                  >
                    <FileCode className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <span className="text-zinc-300 text-xs font-mono truncate flex-1">{file.filename}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Toggle Files Button */}
        <button
          onClick={() => setShowFiles(!showFiles)}
          className="bg-[#030303] border-r border-white/10 px-1 hover:bg-zinc-900"
        >
          {showFiles ? <ChevronDown className="w-4 h-4 text-zinc-500 rotate-90" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
        </button>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Brain className="w-16 h-16 text-[#00FF41]/30 mb-4" />
                <h2 className="font-['Outfit'] text-xl text-white mb-2">START DEBUGGING</h2>
                <p className="text-zinc-500 font-mono text-sm max-w-md">
                  Upload your project files and ask CodeBrain to analyze, debug, or improve your code.
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {messages.map((msg, i) => renderMessage(msg, i))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-white/10 p-4 bg-[#030303]">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask CodeBrain to analyze, debug, or improve your code..."
                disabled={sending}
                data-testid="chat-input"
                className="flex-1 bg-black border border-[#00FF41]/30 text-white rounded-none focus:border-[#00FF41] font-mono h-12"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                data-testid="send-message-button"
                className="bg-[#00FF41] text-black font-bold hover:bg-[#00D632] rounded-none h-12 px-6"
              >
                {streaming ? (
                  <span className="cursor-blink">█</span>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </main>

        {/* File Preview Panel */}
        {selectedFile && (
          <aside className="w-96 border-l border-white/10 bg-[#030303] flex flex-col">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-zinc-300 text-sm font-mono truncate">{selectedFile.filename}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="h-7 w-7 p-0 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <SyntaxHighlighter
                language={getFileLanguage(selectedFile.filename)}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: '#0A0A0A',
                  minHeight: '100%',
                  fontSize: '12px'
                }}
                showLineNumbers
              >
                {selectedFile.content || ''}
              </SyntaxHighlighter>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
};

export default ProjectChatPage;
