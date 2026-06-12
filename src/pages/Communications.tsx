import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Communication } from '@/types';
import { MessageSquare, Phone, ChevronDown, ChevronUp, Pencil, Trash2, Plus, X } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = {
  date: today(),
  participants: '',
  content: '',
  keyConclusions: '',
  nextFollowUpDate: '',
  todoItems: '',
};

export default function Communications() {
  const {
    demands,
    matchResults,
    communications,
    addCommunication,
    updateCommunication,
    deleteCommunication,
    getMatchResultsByDemand,
    getProductById,
  } = useAppStore();

  const [selectedDemandId, setSelectedDemandId] = useState<string>('');
  const [selectedMatchResultId, setSelectedMatchResultId] = useState<string>('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMatchResults = useMemo(() => {
    if (!selectedDemandId) return [];
    return getMatchResultsByDemand(selectedDemandId);
  }, [selectedDemandId, getMatchResultsByDemand]);

  const selectedMatchProduct = useMemo(() => {
    if (!selectedMatchResultId) return null;
    const mr = matchResults.find((m) => m.id === selectedMatchResultId);
    if (!mr) return null;
    return getProductById(mr.productId) ?? null;
  }, [selectedMatchResultId, matchResults, getProductById]);

  const filteredCommunications = useMemo(() => {
    let result = communications;
    if (selectedMatchResultId) {
      result = result.filter((c) => c.matchResultId === selectedMatchResultId);
    } else if (selectedDemandId) {
      result = result.filter((c) => c.demandId === selectedDemandId);
    }
    return [...result].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [communications, selectedDemandId, selectedMatchResultId]);

  const handleDemandChange = (id: string) => {
    setSelectedDemandId(id);
    setSelectedMatchResultId('');
  };

  const handleSubmit = () => {
    if (!selectedDemandId || !selectedMatchResultId) return;
    if (!form.participants.trim() || !form.content.trim()) return;

    const todoArr = form.todoItems
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId) {
      updateCommunication(editingId, {
        date: form.date,
        participants: form.participants.trim(),
        content: form.content.trim(),
        keyConclusions: form.keyConclusions.trim(),
        nextFollowUpDate: form.nextFollowUpDate,
        todoItems: todoArr,
      });
      setEditingId(null);
    } else {
      const comm: Communication = {
        id: crypto.randomUUID(),
        demandId: selectedDemandId,
        matchResultId: selectedMatchResultId,
        date: form.date,
        participants: form.participants.trim(),
        content: form.content.trim(),
        keyConclusions: form.keyConclusions.trim(),
        nextFollowUpDate: form.nextFollowUpDate,
        todoItems: todoArr,
      };
      addCommunication(comm);
    }

    setForm(emptyForm);
  };

  const handleEdit = (comm: Communication) => {
    setEditingId(comm.id);
    setForm({
      date: comm.date,
      participants: comm.participants,
      content: comm.content,
      keyConclusions: comm.keyConclusions,
      nextFollowUpDate: comm.nextFollowUpDate,
      todoItems: comm.todoItems.join(', '),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    deleteCommunication(id);
    if (expandedId === id) setExpandedId(null);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const getFollowUpBadge = (dateStr: string) => {
    if (!dateStr) return null;
    const followUp = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);
    const diff = followUp.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) return <span className="badge-red">已过期</span>;
    if (days <= 3) return <span className="badge-amber">即将到期</span>;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-navy-950">沟通纪要</h1>

      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-navy-700 mb-1">需求</label>
          <select
            className="select-field"
            value={selectedDemandId}
            onChange={(e) => handleDemandChange(e.target.value)}
          >
            <option value="">选择需求</option>
            {demands.map((d) => (
              <option key={d.id} value={d.id}>
                {d.buyerName} - {d.dataScope}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-navy-700 mb-1">匹配结果</label>
          <select
            className="select-field"
            value={selectedMatchResultId}
            onChange={(e) => setSelectedMatchResultId(e.target.value)}
            disabled={!selectedDemandId}
          >
            <option value="">选择匹配结果</option>
            {filteredMatchResults.map((m) => {
              const p = getProductById(m.productId);
              return (
                <option key={m.id} value={m.id}>
                  {p?.name ?? m.productId} (评分: {m.totalScore})
                </option>
              );
            })}
          </select>
        </div>

        {selectedMatchProduct && (
          <div className="flex items-end">
            <span className="badge-emerald">{selectedMatchProduct.name}</span>
          </div>
        )}
      </div>

      {selectedDemandId && selectedMatchResultId && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              {editingId ? '编辑沟通纪要' : '新建沟通纪要'}
            </h2>
            {editingId && (
              <button className="btn-secondary text-sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
                取消编辑
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">日期</label>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">参与方</label>
              <input
                type="text"
                className="input-field"
                placeholder="参与方"
                value={form.participants}
                onChange={(e) => setForm({ ...form, participants: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">纪要内容</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="沟通纪要内容"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">关键结论</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="关键结论"
              value={form.keyConclusions}
              onChange={(e) => setForm({ ...form, keyConclusions: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">下一步跟进日期</label>
              <input
                type="date"
                className="input-field"
                value={form.nextFollowUpDate}
                onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">待办事项</label>
              <input
                type="text"
                className="input-field"
                placeholder="用逗号分隔多个待办"
                value={form.todoItems}
                onChange={(e) => setForm({ ...form, todoItems: e.target.value })}
              />
            </div>
          </div>

          <button className="btn-primary" onClick={handleSubmit}>
            <Plus className="w-4 h-4" />
            {editingId ? '保存修改' : '提交纪要'}
          </button>
        </div>
      )}

      {filteredCommunications.length > 0 && (
        <div className="space-y-0">
          <h2 className="section-title mb-4">沟通记录</h2>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-navy-300" />
            {filteredCommunications.map((comm) => {
              const isExpanded = expandedId === comm.id;
              const Icon = comm.content.includes('电话') || comm.content.includes('通话')
                ? Phone
                : MessageSquare;

              return (
                <div key={comm.id} className="relative mb-6 last:mb-0">
                  <div className="absolute -left-5 top-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center ring-4 ring-white">
                    <Icon className="w-3 h-3 text-white" />
                  </div>

                  <div className="ml-4 card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-navy-800">{comm.participants}</span>
                          <span className="text-xs text-navy-500">{comm.date}</span>
                          {getFollowUpBadge(comm.nextFollowUpDate)}
                        </div>
                        <p className={`text-sm text-navy-700 ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {comm.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="p-1.5 rounded-md hover:bg-navy-200 text-navy-600 transition-colors"
                          onClick={() => handleEdit(comm)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
                          onClick={() => handleDelete(comm.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-md hover:bg-navy-200 text-navy-600 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : comm.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-navy-200 space-y-2">
                        {comm.keyConclusions && (
                          <div>
                            <span className="text-xs font-medium text-navy-500">关键结论：</span>
                            <p className="text-sm text-navy-800">{comm.keyConclusions}</p>
                          </div>
                        )}
                        {comm.nextFollowUpDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-navy-500">跟进日期：</span>
                            <span className="text-sm text-navy-800">{comm.nextFollowUpDate}</span>
                          </div>
                        )}
                        {comm.todoItems.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-navy-500">待办事项：</span>
                            <div className="mt-1 space-y-1">
                              {comm.todoItems.map((item, i) => (
                                <label key={i} className="flex items-center gap-2 text-sm text-navy-700">
                                  <input type="checkbox" className="rounded border-navy-300 text-amber-500 focus:ring-amber-400" />
                                  {item}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!isExpanded && comm.keyConclusions && (
                      <p className="mt-2 text-xs text-navy-500 line-clamp-1">
                        💡 {comm.keyConclusions}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDemandId && filteredCommunications.length === 0 && (
        <div className="text-center py-12 text-navy-500">
          暂无沟通记录，请添加第一条纪要
        </div>
      )}
    </div>
  );
}
