
import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Repeat, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  ChevronRight,
  ArrowRight,
  Tag,
  Flag,
  RefreshCw,
  X
} from 'lucide-react';
import { useTasks } from '../src/hooks/useTasks';

type TaskTab = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

const Tasks: React.FC = () => {
  const { tasks, isLoading, createTask, updateTask } = useTasks();
  const [activeTab, setActiveTab] = useState<TaskTab>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in-progress' | 'done'
  });

  const tabs: { id: TaskTab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <CheckSquare size={16} /> },
    { id: 'upcoming', label: 'Upcoming', icon: <Calendar size={16} /> },
    { id: 'overdue', label: 'Overdue', icon: <AlertCircle size={16} /> },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={16} /> },
    { id: 'all', label: 'All Tasks', icon: <Repeat size={16} /> },
  ];

  const isToday = (date: string | null) => {
    if (!date) return false;
    const today = new Date();
    const taskDate = new Date(date);
    return taskDate.toDateString() === today.toDateString();
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    const today = new Date();
    const taskDate = new Date(date);
    return taskDate < today && taskDate.toDateString() !== today.toDateString();
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      switch (activeTab) {
        case 'today': 
          return isToday(task.due_date) && task.status !== 'done';
        case 'upcoming': 
          return task.due_date && !isToday(task.due_date) && !isOverdue(task.due_date) && task.status !== 'done';
        case 'overdue': 
          return isOverdue(task.due_date) && task.status !== 'done';
        case 'completed': 
          return task.status === 'done';
        case 'all':
          return true;
        default: 
          return true;
      }
    });
  }, [tasks, activeTab, searchQuery]);

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await updateTask.mutateAsync({ id: taskId, updates: { status: newStatus } });
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'todo'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      priority: task.priority,
      status: task.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          updates: {
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date || null,
            priority: formData.priority,
            status: formData.status
          }
        });
      } else {
        await createTask.mutateAsync({
          title: formData.title,
          description: formData.description || null,
          due_date: formData.due_date || null,
          priority: formData.priority,
          status: formData.status,
          assigned_to: null
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin text-brand-600 mx-auto" />
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 sticky top-16 bg-gray-50/90 backdrop-blur-sm z-20 overflow-x-auto no-scrollbar">
        <div className="flex whitespace-nowrap scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-5 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-300'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both max-w-4xl mx-auto">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
              <Filter size={18} /> Filter
            </button>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              <Plus size={18} /> Add Task
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 group transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}
              >
                <button 
                  onClick={() => handleToggleComplete(task.id, task.status)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    task.status === 'done'
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-200 hover:border-blue-400 text-transparent hover:text-blue-100'
                  }`}
                >
                  <CheckCircle2 size={16} />
                </button>
                
                <div 
                  onClick={() => openEditModal(task)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-sm font-bold truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Clock size={10} /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </span>
                    {task.description && (
                      <>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[10px] font-medium text-gray-400 truncate max-w-xs">
                          {task.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                <CheckSquare size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Clear skies!</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                  You don't have any {activeTab} tasks. Take a moment to breathe or plan ahead.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('upcoming')}
                className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto"
              >
                View Upcoming <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Productivity Tip */}
        <div className="mt-12 p-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl text-white shadow-xl shadow-blue-100 flex items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="font-bold mb-1 flex items-center gap-2">
              <Star size={18} className="text-indigo-200" /> Focus Mode Tip
            </h3>
            <p className="text-sm text-indigo-500-100 leading-relaxed font-medium">
              "Tackle your high-priority 'Deep Work' task before 11 AM to maintain momentum for the rest of the day."
            </p>
          </div>
          <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all shrink-0 relative z-10">
             <ChevronRight size={24} />
          </button>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingTask ? 'Update task details' : 'Add a new task to your workflow'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Review Q3 Marketing Strategy"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details about this task..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 resize-none"
                />
              </div>

              {/* Due Date, Priority, Status in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 font-medium"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-900 font-medium"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 text-white bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
