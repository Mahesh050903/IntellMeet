import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Plus, CheckCircle, Clock, AlertTriangle, ArrowRight, User, Calendar } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const fetchTasks = async () => {
    setLoading(true);
    const res = await apiFetch('/tasks');
    if (res.success && res.data?.tasks) {
      setTasks(res.data.tasks);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        assigneeName: assigneeName.trim() || 'Unassigned',
        priority,
        status: 'todo',
      }),
    });

    if (res.success && res.data?.task) {
      setTasks((prev) => [res.data.task, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setAssigneeName('');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    const res = await apiFetch(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.success) {
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: newStatus } : t))
      );
    }
  };

  const columns: Array<{ id: 'todo' | 'in-progress' | 'done'; title: string; color: string }> = [
    { id: 'todo', title: 'To Do', color: '#818cf8' },
    { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
    { id: 'done', title: 'Completed', color: '#10b981' },
  ];

  const getPriorityBadge = (p: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      high: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
      medium: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
      low: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
    };
    const c = colors[p] || colors.medium;
    return (
      <span style={{
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '4px',
        background: c.bg,
        color: c.text,
      }}>
        {p}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '36px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Collaboration Kanban Board</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            Track project deliverables and action items generated from AI meetings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="gradient-btn"
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
          }}
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* 3 Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start',
      }}>
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => (t.status || 'todo') === col.id);
          return (
            <div
              key={col.id}
              className="glass-panel"
              style={{
                padding: '20px',
                minHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>{col.title}</h4>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  color: '#cbd5e1',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 10px', color: '#64748b', fontSize: '0.85rem' }}>
                    No tasks in {col.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const taskId = t._id || t.id;
                    return (
                      <div
                        key={taskId}
                        className="glass-card"
                        style={{
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {getPriorityBadge(t.priority || 'medium')}
                          {t.sourceMeetingId && (
                            <span style={{ fontSize: '0.7rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                              AI Meeting Action
                            </span>
                          )}
                        </div>

                        <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                          {t.title}
                        </h5>

                        {t.description && (
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                            {t.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
                            <User size={13} /> {t.assigneeName || 'Unassigned'}
                          </span>
                        </div>

                        {/* Status Switcher Actions */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                          {col.id !== 'todo' && (
                            <button
                              onClick={() => handleUpdateStatus(taskId, 'todo')}
                              style={{
                                flex: 1,
                                fontSize: '0.72rem',
                                padding: '5px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              ← To Do
                            </button>
                          )}
                          {col.id !== 'in-progress' && (
                            <button
                              onClick={() => handleUpdateStatus(taskId, 'in-progress')}
                              style={{
                                flex: 1,
                                fontSize: '0.72rem',
                                padding: '5px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#fbbf24',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              In Progress
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              onClick={() => handleUpdateStatus(taskId, 'done')}
                              style={{
                                flex: 1,
                                fontSize: '0.72rem',
                                padding: '5px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#34d399',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              Done ✓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Create New Kanban Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Integrate Redis session adapter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide technical criteria or notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
                    Assignee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: '#94a3b8' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-btn"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
