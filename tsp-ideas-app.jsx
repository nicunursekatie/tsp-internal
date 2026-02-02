import React, { useState, useEffect, createContext, useContext } from 'react';
import { Users, Plus, MessageSquare, CheckCircle, Clock, AlertTriangle, LogOut, Home, FileText, Vote, Gavel, Play, Archive, ChevronRight, ThumbsUp, Send, X, Edit3, Calendar, User, Target, DollarSign, Users as UsersIcon } from 'lucide-react';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================

const WORKFLOW_STAGES = {
  SUBMITTED: { id: 'submitted', label: 'Submitted', icon: FileText, color: 'bg-blue-500', description: 'Awaiting team feedback' },
  FEEDBACK: { id: 'feedback', label: 'Feedback Period', icon: MessageSquare, color: 'bg-purple-500', description: '5-day feedback window' },
  SECONDED: { id: 'seconded', label: 'Seconded', icon: ThumbsUp, color: 'bg-indigo-500', description: 'Ready for review meeting' },
  IN_REVIEW: { id: 'in_review', label: 'In Review', icon: Vote, color: 'bg-yellow-500', description: 'Being discussed at review meeting' },
  DECIDED: { id: 'decided', label: 'Decided', icon: Gavel, color: 'bg-orange-500', description: 'Decision made, may be appealed' },
  IN_PROGRESS: { id: 'in_progress', label: 'In Progress', icon: Play, color: 'bg-green-500', description: 'Being implemented' },
  COMPLETED: { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-emerald-600', description: 'Successfully implemented' },
  DECLINED: { id: 'declined', label: 'Declined', icon: X, color: 'bg-red-500', description: 'Not moving forward' },
  ARCHIVED: { id: 'archived', label: 'Archived', icon: Archive, color: 'bg-gray-500', description: 'No longer active' }
};

const DECISION_TYPES = {
  APPROVED: 'approved',
  DECLINED: 'declined',
  NEEDS_REVISION: 'needs_revision',
  DEFERRED: 'deferred'
};

// ============================================================================
// CONTEXT: Authentication
// ============================================================================

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('tsp_current_user');
    const savedUsers = localStorage.getItem('tsp_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem('tsp_users', JSON.stringify(newUsers));
  };

  const register = (name, email, password, role = 'team_member') => {
    if (users.find(u => u.email === email)) {
      return { error: 'Email already registered' };
    }
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash this!
      role, // 'ed' (Executive Director), 'core_team', 'team_member'
      createdAt: new Date().toISOString()
    };
    const newUsers = [...users, newUser];
    saveUsers(newUsers);
    setUser(newUser);
    localStorage.setItem('tsp_current_user', JSON.stringify(newUser));
    return { success: true };
  };

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('tsp_current_user', JSON.stringify(foundUser));
      return { success: true };
    }
    return { error: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tsp_current_user');
  };

  const updateUser = (userId, updates) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    saveUsers(newUsers);
    if (user?.id === userId) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('tsp_current_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, users, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// CONTEXT: Ideas Data
// ============================================================================

const IdeasContext = createContext(null);

const useIdeas = () => {
  const context = useContext(IdeasContext);
  if (!context) throw new Error('useIdeas must be used within IdeasProvider');
  return context;
};

const IdeasProvider = ({ children }) => {
  const [ideas, setIdeas] = useState([]);
  const [appeals, setAppeals] = useState([]);

  useEffect(() => {
    const savedIdeas = localStorage.getItem('tsp_ideas');
    const savedAppeals = localStorage.getItem('tsp_appeals');
    if (savedIdeas) setIdeas(JSON.parse(savedIdeas));
    if (savedAppeals) setAppeals(JSON.parse(savedAppeals));
  }, []);

  const saveIdeas = (newIdeas) => {
    setIdeas(newIdeas);
    localStorage.setItem('tsp_ideas', JSON.stringify(newIdeas));
  };

  const saveAppeals = (newAppeals) => {
    setAppeals(newAppeals);
    localStorage.setItem('tsp_appeals', JSON.stringify(newAppeals));
  };

  const submitIdea = (idea, userId, userName) => {
    const newIdea = {
      id: Date.now().toString(),
      ...idea,
      submitterId: userId,
      submitterName: userName,
      status: 'submitted',
      feedbackDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      seconds: [],
      comments: [],
      decision: null,
      owner: null,
      actionPlan: null,
      checkIns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveIdeas([...ideas, newIdea]);
    return newIdea;
  };

  const updateIdea = (ideaId, updates) => {
    const newIdeas = ideas.map(idea =>
      idea.id === ideaId
        ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
        : idea
    );
    saveIdeas(newIdeas);
  };

  const addSecond = (ideaId, userId, userName) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea || idea.seconds.find(s => s.userId === userId)) return;

    const newSeconds = [...idea.seconds, { userId, userName, timestamp: new Date().toISOString() }];
    const updates = { seconds: newSeconds };

    // Auto-advance to 'seconded' if 2+ seconds
    if (newSeconds.length >= 2 && idea.status === 'submitted') {
      updates.status = 'seconded';
    }

    updateIdea(ideaId, updates);
  };

  const addComment = (ideaId, userId, userName, text) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const newComment = {
      id: Date.now().toString(),
      userId,
      userName,
      text,
      timestamp: new Date().toISOString()
    };

    updateIdea(ideaId, { comments: [...idea.comments, newComment] });
  };

  const makeDecision = (ideaId, decision, rationale, deciderId, deciderName) => {
    const newStatus = decision === DECISION_TYPES.APPROVED ? 'in_progress' : 'declined';
    updateIdea(ideaId, {
      status: newStatus,
      decision: {
        type: decision,
        rationale,
        deciderId,
        deciderName,
        timestamp: new Date().toISOString(),
        appealDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  };

  const submitAppeal = (ideaId, userId, userName, reason, preferredOutcome) => {
    const newAppeal = {
      id: Date.now().toString(),
      ideaId,
      submitterId: userId,
      submitterName: userName,
      reason,
      preferredOutcome,
      status: 'pending', // pending, under_review, upheld, denied
      votes: [],
      reviewDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    saveAppeals([...appeals, newAppeal]);
    return newAppeal;
  };

  const voteOnAppeal = (appealId, userId, userName, vote) => {
    const newAppeals = appeals.map(appeal => {
      if (appeal.id !== appealId) return appeal;
      const existingVoteIndex = appeal.votes.findIndex(v => v.userId === userId);
      let newVotes = [...appeal.votes];
      if (existingVoteIndex >= 0) {
        newVotes[existingVoteIndex] = { userId, userName, vote, timestamp: new Date().toISOString() };
      } else {
        newVotes.push({ userId, userName, vote, timestamp: new Date().toISOString() });
      }
      return { ...appeal, votes: newVotes };
    });
    saveAppeals(newAppeals);
  };

  const resolveAppeal = (appealId, outcome) => {
    const appeal = appeals.find(a => a.id === appealId);
    if (!appeal) return;

    const newAppeals = appeals.map(a =>
      a.id === appealId ? { ...a, status: outcome } : a
    );
    saveAppeals(newAppeals);

    // If upheld, reverse the decision
    if (outcome === 'upheld') {
      updateIdea(appeal.ideaId, { status: 'seconded', decision: null });
    }
  };

  const assignOwner = (ideaId, ownerId, ownerName) => {
    updateIdea(ideaId, { owner: { id: ownerId, name: ownerName } });
  };

  const updateActionPlan = (ideaId, actionPlan) => {
    updateIdea(ideaId, { actionPlan });
  };

  const addCheckIn = (ideaId, userId, userName, note, progress) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const newCheckIn = {
      id: Date.now().toString(),
      userId,
      userName,
      note,
      progress,
      timestamp: new Date().toISOString()
    };

    updateIdea(ideaId, { checkIns: [...(idea.checkIns || []), newCheckIn] });
  };

  const completeIdea = (ideaId) => {
    updateIdea(ideaId, { status: 'completed', completedAt: new Date().toISOString() });
  };

  return (
    <IdeasContext.Provider value={{
      ideas,
      appeals,
      submitIdea,
      updateIdea,
      addSecond,
      addComment,
      makeDecision,
      submitAppeal,
      voteOnAppeal,
      resolveAppeal,
      assignOwner,
      updateActionPlan,
      addCheckIn,
      completeIdea
    }}>
      {children}
    </IdeasContext.Provider>
  );
};

// ============================================================================
// COMPONENTS: Auth
// ============================================================================

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'team_member' });
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const result = login(formData.email, formData.password);
      if (result.error) setError(result.error);
    } else {
      if (!formData.name.trim()) {
        setError('Name is required');
        return;
      }
      const result = register(formData.name, formData.email, formData.password, formData.role);
      if (result.error) setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🥪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">The Sandwich Project</h1>
          <p className="text-gray-600 mt-2">Idea & Decision Hub</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="team_member">Team Member</option>
                  <option value="core_team">Core Team</option>
                  <option value="ed">Executive Director</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-amber-600 font-semibold ml-2 hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS: Layout & Navigation
// ============================================================================

const Sidebar = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const { ideas, appeals } = useIdeas();

  const pendingAppeals = appeals.filter(a => a.status === 'pending').length;
  const inFeedback = ideas.filter(i => i.status === 'submitted').length;
  const readyForReview = ideas.filter(i => i.status === 'seconded').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'submit', label: 'Submit Idea', icon: Plus },
    { id: 'feedback', label: 'Feedback Queue', icon: MessageSquare, badge: inFeedback },
    { id: 'review', label: 'Review Queue', icon: Vote, badge: readyForReview },
    { id: 'active', label: 'Active Ideas', icon: Play },
    { id: 'appeals', label: 'Appeals', icon: Gavel, badge: pendingAppeals },
    { id: 'archive', label: 'Archive', icon: Archive }
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">🥪</span>
          </div>
          <div>
            <h1 className="text-white font-bold">TSP Ideas</h1>
            <p className="text-gray-400 text-xs">Decision Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS: Dashboard
// ============================================================================

const Dashboard = ({ setCurrentView, setSelectedIdea }) => {
  const { ideas } = useIdeas();
  const { users } = useAuth();

  const stats = {
    total: ideas.length,
    inProgress: ideas.filter(i => i.status === 'in_progress').length,
    completed: ideas.filter(i => i.status === 'completed').length,
    awaitingFeedback: ideas.filter(i => i.status === 'submitted').length,
    seconded: ideas.filter(i => i.status === 'seconded').length
  };

  const recentIdeas = [...ideas].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of all ideas and their progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-gray-500 text-sm">Total Ideas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.awaitingFeedback}</p>
              <p className="text-gray-500 text-sm">Awaiting Feedback</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ThumbsUp className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.seconded}</p>
              <p className="text-gray-500 text-sm">Seconded</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
              <p className="text-gray-500 text-sm">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
              <p className="text-gray-500 text-sm">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Pipeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Workflow Pipeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {Object.values(WORKFLOW_STAGES).slice(0, 7).map((stage, idx) => {
            const count = ideas.filter(i => i.status === stage.id).length;
            const Icon = stage.icon;
            return (
              <React.Fragment key={stage.id}>
                <div className="flex-shrink-0 flex flex-col items-center gap-2 min-w-[100px]">
                  <div className={`w-12 h-12 ${stage.color} rounded-full flex items-center justify-center text-white`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-800">{stage.label}</p>
                    <p className="text-lg font-bold text-gray-800">{count}</p>
                  </div>
                </div>
                {idx < 6 && <ChevronRight className="text-gray-300 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Recent Ideas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Ideas</h2>
          <button
            onClick={() => setCurrentView('submit')}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            <Plus size={18} />
            Submit New
          </button>
        </div>

        {recentIdeas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No ideas yet. Be the first to submit one!</p>
        ) : (
          <div className="space-y-3">
            {recentIdeas.map(idea => {
              const stage = WORKFLOW_STAGES[idea.status.toUpperCase()] || WORKFLOW_STAGES.SUBMITTED;
              return (
                <div
                  key={idea.id}
                  onClick={() => { setSelectedIdea(idea); setCurrentView('detail'); }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{idea.title}</p>
                    <p className="text-sm text-gray-500">by {idea.submitterName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ThumbsUp size={14} />
                    <span>{idea.seconds?.length || 0}</span>
                    <MessageSquare size={14} className="ml-2" />
                    <span>{idea.comments?.length || 0}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS: Idea Submission Form
// ============================================================================

const IdeaSubmissionForm = ({ setCurrentView }) => {
  const { user } = useAuth();
  const { submitIdea } = useIdeas();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    whyItMatters: '',
    whoNeeded: '',
    resources: '',
    timeline: '',
    risks: '',
    missionAlignment: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    submitIdea(formData, user.id, user.name);
    setSubmitted(true);
    setTimeout(() => setCurrentView('dashboard'), 2000);
  };

  if (submitted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Idea Submitted!</h2>
          <p className="text-gray-600">Your idea is now in the feedback queue. Team members have 5 days to review and second it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Submit an Idea</h1>
        <p className="text-gray-600">Share your idea with the team. Ideas with 2+ seconds advance to review.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Brief, descriptive title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={4}
            placeholder="Detailed explanation of your idea"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Target className="inline mr-1" size={14} />
            Why It Matters <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.whyItMatters}
            onChange={(e) => setFormData({ ...formData, whyItMatters: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={3}
            placeholder="How does this help TSP's mission?"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UsersIcon className="inline mr-1" size={14} />
              Who's Needed
            </label>
            <input
              type="text"
              value={formData.whoNeeded}
              onChange={(e) => setFormData({ ...formData, whoNeeded: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., 2 volunteers, marketing team"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline mr-1" size={14} />
              Resources Required
            </label>
            <input
              type="text"
              value={formData.resources}
              onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., $500 budget, new software"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline mr-1" size={14} />
              Timeline
            </label>
            <input
              type="text"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., 2 weeks, Q2 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <AlertTriangle className="inline mr-1" size={14} />
              Risks/Concerns
            </label>
            <input
              type="text"
              value={formData.risks}
              onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Potential challenges or downsides"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mission Alignment
          </label>
          <textarea
            value={formData.missionAlignment}
            onChange={(e) => setFormData({ ...formData, missionAlignment: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={2}
            placeholder="How does this align with TSP's core mission?"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Submit Idea
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// COMPONENTS: Idea Detail View
// ============================================================================

const IdeaDetail = ({ idea, setCurrentView, setSelectedIdea }) => {
  const { user, users } = useAuth();
  const { addSecond, addComment, makeDecision, assignOwner, addCheckIn, completeIdea, submitAppeal, appeals } = useIdeas();
  const [comment, setComment] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInProgress, setCheckInProgress] = useState(50);

  if (!idea) return null;

  const stage = WORKFLOW_STAGES[idea.status.toUpperCase()] || WORKFLOW_STAGES.SUBMITTED;
  const hasSeconded = idea.seconds?.some(s => s.userId === user.id);
  const isSubmitter = idea.submitterId === user.id;
  const isED = user.role === 'ed';
  const isCoreTeam = user.role === 'core_team' || isED;
  const canAppeal = idea.decision && new Date(idea.decision.appealDeadline) > new Date();
  const existingAppeal = appeals.find(a => a.ideaId === idea.id && a.status === 'pending');

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addComment(idea.id, user.id, user.name, comment);
    setComment('');
  };

  const handleSecond = () => {
    addSecond(idea.id, user.id, user.name);
  };

  const handleAddCheckIn = (e) => {
    e.preventDefault();
    if (!checkInNote.trim()) return;
    addCheckIn(idea.id, user.id, user.name, checkInNote, checkInProgress);
    setCheckInNote('');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => { setSelectedIdea(null); setCurrentView('dashboard'); }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${stage.color} mb-2`}>
              {stage.label}
            </span>
            <h1 className="text-2xl font-bold text-gray-800">{idea.title}</h1>
            <p className="text-gray-500 mt-1">
              Submitted by {idea.submitterName} on {new Date(idea.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-gray-500">
              <ThumbsUp size={16} />
              {idea.seconds?.length || 0} seconds
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {(idea.status === 'submitted' || idea.status === 'feedback') && !hasSeconded && !isSubmitter && (
            <button
              onClick={handleSecond}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <ThumbsUp size={16} />
              Second This Idea
            </button>
          )}
          {hasSeconded && (
            <span className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <CheckCircle size={16} />
              You seconded this
            </span>
          )}
          {idea.status === 'seconded' && isCoreTeam && (
            <button
              onClick={() => setShowDecisionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Gavel size={16} />
              Make Decision
            </button>
          )}
          {idea.status === 'in_progress' && isCoreTeam && !idea.owner && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <User size={16} />
              Assign Owner
            </button>
          )}
          {idea.status === 'in_progress' && (idea.owner?.id === user.id || isCoreTeam) && (
            <button
              onClick={() => completeIdea(idea.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <CheckCircle size={16} />
              Mark Complete
            </button>
          )}
          {canAppeal && !existingAppeal && (
            <button
              onClick={() => setShowAppealModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              <AlertTriangle size={16} />
              Appeal Decision
            </button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{idea.description}</p>
          </div>

          {/* Why It Matters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">Why It Matters</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{idea.whyItMatters}</p>
          </div>

          {/* Decision */}
          {idea.decision && (
            <div className={`rounded-xl p-6 ${idea.decision.type === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Gavel size={18} />
                Decision: {idea.decision.type.replace('_', ' ').toUpperCase()}
              </h2>
              <p className="text-gray-600 mb-2">{idea.decision.rationale}</p>
              <p className="text-sm text-gray-500">
                By {idea.decision.deciderName} on {new Date(idea.decision.timestamp).toLocaleDateString()}
              </p>
              {canAppeal && (
                <p className="text-sm text-amber-600 mt-2">
                  Appeal deadline: {new Date(idea.decision.appealDeadline).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Check-ins (for in-progress ideas) */}
          {idea.status === 'in_progress' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Progress Check-ins</h2>

              {(idea.owner?.id === user.id || isCoreTeam) && (
                <form onSubmit={handleAddCheckIn} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progress: {checkInProgress}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={checkInProgress}
                      onChange={(e) => setCheckInProgress(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <textarea
                    value={checkInNote}
                    onChange={(e) => setCheckInNote(e.target.value)}
                    placeholder="What's the latest update?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Add Check-in
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {(idea.checkIns || []).map(checkIn => (
                  <div key={checkIn.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{checkIn.userName}</span>
                      <span className="text-sm text-gray-500">{new Date(checkIn.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${checkIn.progress}%` }} />
                    </div>
                    <p className="text-gray-600">{checkIn.note}</p>
                  </div>
                ))}
                {(!idea.checkIns || idea.checkIns.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No check-ins yet</p>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Comments ({idea.comments?.length || 0})</h2>

            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {(idea.comments || []).map(c => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{c.userName}</span>
                    <span className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600">{c.text}</p>
                </div>
              ))}
              {(!idea.comments || idea.comments.length === 0) && (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              {idea.whoNeeded && (
                <div>
                  <span className="text-gray-500">Who's Needed:</span>
                  <p className="text-gray-800">{idea.whoNeeded}</p>
                </div>
              )}
              {idea.resources && (
                <div>
                  <span className="text-gray-500">Resources:</span>
                  <p className="text-gray-800">{idea.resources}</p>
                </div>
              )}
              {idea.timeline && (
                <div>
                  <span className="text-gray-500">Timeline:</span>
                  <p className="text-gray-800">{idea.timeline}</p>
                </div>
              )}
              {idea.risks && (
                <div>
                  <span className="text-gray-500">Risks:</span>
                  <p className="text-gray-800">{idea.risks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Seconds */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Seconds ({idea.seconds?.length || 0}/2 needed)
            </h3>
            <div className="space-y-2">
              {(idea.seconds || []).map(s => (
                <div key={s.userId} className="flex items-center gap-2 text-sm">
                  <ThumbsUp size={14} className="text-indigo-500" />
                  <span>{s.userName}</span>
                </div>
              ))}
              {(!idea.seconds || idea.seconds.length === 0) && (
                <p className="text-gray-500 text-sm">No seconds yet</p>
              )}
            </div>
          </div>

          {/* Owner */}
          {idea.owner && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Owner</h3>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-green-600" />
                </div>
                <span className="font-medium text-gray-800">{idea.owner.name}</span>
              </div>
            </div>
          )}

          {/* Feedback Deadline */}
          {(idea.status === 'submitted' || idea.status === 'feedback') && idea.feedbackDeadline && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock size={18} />
                <span className="font-medium">Feedback Deadline</span>
              </div>
              <p className="text-amber-600 mt-1">
                {new Date(idea.feedbackDeadline).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <DecisionModal
          idea={idea}
          onClose={() => setShowDecisionModal(false)}
          onDecision={(decision, rationale) => {
            makeDecision(idea.id, decision, rationale, user.id, user.name);
            setShowDecisionModal(false);
          }}
        />
      )}

      {/* Appeal Modal */}
      {showAppealModal && (
        <AppealModal
          idea={idea}
          onClose={() => setShowAppealModal(false)}
          onSubmit={(reason, preferredOutcome) => {
            submitAppeal(idea.id, user.id, user.name, reason, preferredOutcome);
            setShowAppealModal(false);
          }}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignOwnerModal
          users={users}
          onClose={() => setShowAssignModal(false)}
          onAssign={(ownerId, ownerName) => {
            assignOwner(idea.id, ownerId, ownerName);
            setShowAssignModal(false);
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTS: Modals
// ============================================================================

const DecisionModal = ({ idea, onClose, onDecision }) => {
  const [decision, setDecision] = useState('approved');
  const [rationale, setRationale] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Make Decision</h2>
        <p className="text-gray-600 mb-4">Decide on: <strong>{idea.title}</strong></p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
          <div className="space-y-2">
            {Object.entries(DECISION_TYPES).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={value}
                  checked={decision === value}
                  onChange={(e) => setDecision(e.target.value)}
                  className="text-amber-500 focus:ring-amber-500"
                />
                <span className="capitalize">{value.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rationale <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={4}
            placeholder="Explain your decision (required for transparency)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Must cite mission, budget, or legal considerations if declining.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onDecision(decision, rationale)}
            disabled={!rationale.trim()}
            className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Decision
          </button>
        </div>
      </div>
    </div>
  );
};

const AppealModal = ({ idea, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [preferredOutcome, setPreferredOutcome] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Appeal Decision</h2>
        <p className="text-gray-600 mb-4">
          Appealing decision on: <strong>{idea.title}</strong>
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why do you disagree? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={4}
            placeholder="Explain your concerns with this decision"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Outcome <span className="text-red-500">*</span>
          </label>
          <textarea
            value={preferredOutcome}
            onChange={(e) => setPreferredOutcome(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={2}
            placeholder="What outcome would you like to see?"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason, preferredOutcome)}
            disabled={!reason.trim() || !preferredOutcome.trim()}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Appeal
          </button>
        </div>
      </div>
    </div>
  );
};

const AssignOwnerModal = ({ users, onClose, onAssign }) => {
  const [selectedUser, setSelectedUser] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Assign Owner</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select team member</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Choose...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const user = users.find(u => u.id === selectedUser);
              if (user) onAssign(user.id, user.name);
            }}
            disabled={!selectedUser}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS: List Views
// ============================================================================

const IdeaList = ({ ideas, title, subtitle, emptyMessage, setSelectedIdea, setCurrentView }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {ideas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ideas.map(idea => {
            const stage = WORKFLOW_STAGES[idea.status.toUpperCase()] || WORKFLOW_STAGES.SUBMITTED;
            return (
              <div
                key={idea.id}
                onClick={() => { setSelectedIdea(idea); setCurrentView('detail'); }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${stage.color}`}>
                        {stage.label}
                      </span>
                      {idea.seconds?.length >= 2 && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium">
                          ✓ Seconded
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{idea.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{idea.description}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      by {idea.submitterName} · {new Date(idea.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={14} />
                        {idea.seconds?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {idea.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FeedbackQueue = ({ setSelectedIdea, setCurrentView }) => {
  const { ideas } = useIdeas();
  const feedbackIdeas = ideas.filter(i => i.status === 'submitted' || i.status === 'feedback');

  return (
    <IdeaList
      ideas={feedbackIdeas}
      title="Feedback Queue"
      subtitle="Ideas awaiting team input. Second ideas you support to move them forward."
      emptyMessage="No ideas awaiting feedback. Submit a new idea!"
      setSelectedIdea={setSelectedIdea}
      setCurrentView={setCurrentView}
    />
  );
};

const ReviewQueue = ({ setSelectedIdea, setCurrentView }) => {
  const { ideas } = useIdeas();
  const reviewIdeas = ideas.filter(i => i.status === 'seconded' || i.status === 'in_review');

  return (
    <IdeaList
      ideas={reviewIdeas}
      title="Review Queue"
      subtitle="Ideas with 2+ seconds, ready for discussion and decision."
      emptyMessage="No ideas ready for review. Second more ideas in the feedback queue!"
      setSelectedIdea={setSelectedIdea}
      setCurrentView={setCurrentView}
    />
  );
};

const ActiveIdeas = ({ setSelectedIdea, setCurrentView }) => {
  const { ideas } = useIdeas();
  const activeIdeas = ideas.filter(i => i.status === 'in_progress');

  return (
    <IdeaList
      ideas={activeIdeas}
      title="Active Ideas"
      subtitle="Ideas currently being implemented."
      emptyMessage="No ideas currently in progress."
      setSelectedIdea={setSelectedIdea}
      setCurrentView={setCurrentView}
    />
  );
};

const ArchiveView = ({ setSelectedIdea, setCurrentView }) => {
  const { ideas } = useIdeas();
  const archivedIdeas = ideas.filter(i => ['completed', 'declined', 'archived'].includes(i.status));

  return (
    <IdeaList
      ideas={archivedIdeas}
      title="Archive"
      subtitle="Completed, declined, and archived ideas."
      emptyMessage="No archived ideas yet."
      setSelectedIdea={setSelectedIdea}
      setCurrentView={setCurrentView}
    />
  );
};

// ============================================================================
// COMPONENTS: Appeals View
// ============================================================================

const AppealsView = ({ setSelectedIdea, setCurrentView }) => {
  const { user } = useAuth();
  const { ideas, appeals, voteOnAppeal, resolveAppeal } = useIdeas();
  const isCoreTeam = user.role === 'core_team' || user.role === 'ed';

  const pendingAppeals = appeals.filter(a => a.status === 'pending');
  const resolvedAppeals = appeals.filter(a => a.status !== 'pending');

  const handleVote = (appealId, vote) => {
    voteOnAppeal(appealId, user.id, user.name, vote);
  };

  const handleResolve = (appeal) => {
    const yesVotes = appeal.votes.filter(v => v.vote === 'uphold').length;
    const noVotes = appeal.votes.filter(v => v.vote === 'deny').length;
    const outcome = yesVotes > noVotes ? 'upheld' : 'denied';
    resolveAppeal(appeal.id, outcome);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appeals</h1>
        <p className="text-gray-600">Review and vote on appealed decisions</p>
      </div>

      {pendingAppeals.length === 0 && resolvedAppeals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No appeals yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingAppeals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Appeals</h2>
              <div className="space-y-4">
                {pendingAppeals.map(appeal => {
                  const idea = ideas.find(i => i.id === appeal.ideaId);
                  const userVote = appeal.votes.find(v => v.userId === user.id);
                  const yesVotes = appeal.votes.filter(v => v.vote === 'uphold').length;
                  const noVotes = appeal.votes.filter(v => v.vote === 'deny').length;

                  return (
                    <div key={appeal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">{idea?.title || 'Unknown Idea'}</h3>
                          <p className="text-sm text-gray-500">
                            Appealed by {appeal.submitterName} on {new Date(appeal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Review by {new Date(appeal.reviewDeadline).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Reason for appeal:</p>
                        <p className="text-gray-600">{appeal.reason}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Preferred outcome:</p>
                        <p className="text-gray-600">{appeal.preferredOutcome}</p>
                      </div>

                      {isCoreTeam && appeal.submitterId !== user.id && (
                        <div className="flex items-center gap-4 pt-4 border-t">
                          <span className="text-sm text-gray-500">Your vote:</span>
                          <button
                            onClick={() => handleVote(appeal.id, 'uphold')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              userVote?.vote === 'uphold'
                                ? 'bg-green-500 text-white'
                                : 'border border-green-500 text-green-500 hover:bg-green-50'
                            }`}
                          >
                            Uphold Appeal
                          </button>
                          <button
                            onClick={() => handleVote(appeal.id, 'deny')}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              userVote?.vote === 'deny'
                                ? 'bg-red-500 text-white'
                                : 'border border-red-500 text-red-500 hover:bg-red-50'
                            }`}
                          >
                            Deny Appeal
                          </button>
                          <span className="ml-auto text-sm text-gray-500">
                            Votes: {yesVotes} uphold, {noVotes} deny
                          </span>
                          {isCoreTeam && appeal.votes.length >= 2 && (
                            <button
                              onClick={() => handleResolve(appeal)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {resolvedAppeals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Resolved Appeals</h2>
              <div className="space-y-4">
                {resolvedAppeals.map(appeal => {
                  const idea = ideas.find(i => i.id === appeal.ideaId);
                  return (
                    <div key={appeal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{idea?.title || 'Unknown Idea'}</h3>
                          <p className="text-sm text-gray-500">Appealed by {appeal.submitterName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appeal.status === 'upheld'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

const MainApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const { ideas } = useIdeas();

  // Update selected idea when ideas change
  useEffect(() => {
    if (selectedIdea) {
      const updated = ideas.find(i => i.id === selectedIdea.id);
      if (updated) setSelectedIdea(updated);
    }
  }, [ideas, selectedIdea?.id]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} setSelectedIdea={setSelectedIdea} />;
      case 'submit':
        return <IdeaSubmissionForm setCurrentView={setCurrentView} />;
      case 'feedback':
        return <FeedbackQueue setSelectedIdea={setSelectedIdea} setCurrentView={setCurrentView} />;
      case 'review':
        return <ReviewQueue setSelectedIdea={setSelectedIdea} setCurrentView={setCurrentView} />;
      case 'active':
        return <ActiveIdeas setSelectedIdea={setSelectedIdea} setCurrentView={setCurrentView} />;
      case 'appeals':
        return <AppealsView setSelectedIdea={setSelectedIdea} setCurrentView={setCurrentView} />;
      case 'archive':
        return <ArchiveView setSelectedIdea={setSelectedIdea} setCurrentView={setCurrentView} />;
      case 'detail':
        return <IdeaDetail idea={selectedIdea} setCurrentView={setCurrentView} setSelectedIdea={setSelectedIdea} />;
      default:
        return <Dashboard setCurrentView={setCurrentView} setSelectedIdea={setSelectedIdea} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
};

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export default function TSPIdeasApp() {
  return (
    <AuthProvider>
      <IdeasProvider>
        <AppContent />
      </IdeasProvider>
    </AuthProvider>
  );
}

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return user ? <MainApp /> : <AuthForm />;
};
