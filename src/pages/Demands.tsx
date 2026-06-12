import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil, Trash2, ArrowRight, Save, X, Search } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { Demand, DemandStatus } from '@/types';

const INDUSTRIES = ['金融', '医疗', '交通', '电商', '工业', '农业', '物流', '能源'];
const FREQUENCIES = ['实时', '每日', '每周', '每月', '季度'];
const STATUS_OPTIONS: { value: '' | DemandStatus; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待匹配' },
  { value: 'matching', label: '匹配中' },
  { value: 'completed', label: '已完成' },
];

const STATUS_BADGE: Record<DemandStatus, { className: string; label: string }> = {
  pending: { className: 'badge-amber', label: '待匹配' },
  matching: { className: 'badge-navy', label: '匹配中' },
  completed: { className: 'badge-emerald', label: '已完成' },
};

interface FormState {
  buyerName: string;
  industry: string;
  dataScope: string;
  updateFrequency: string;
  budgetMin: string;
  budgetMax: string;
  complianceReqs: string;
}

const INITIAL_FORM: FormState = {
  buyerName: '',
  industry: '',
  dataScope: '',
  updateFrequency: '',
  budgetMin: '',
  budgetMax: '',
  complianceReqs: '',
};

export default function Demands() {
  const navigate = useNavigate();
  const { demands, addDemand, updateDemand, deleteDemand } = useAppStore();

  const [formCollapsed, setFormCollapsed] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | DemandStatus>('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Demand>>({});

  const filtered = demands.filter((d) => {
    const matchSearch =
      !search ||
      d.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      d.industry.includes(search);
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const demand: Demand = {
      id: crypto.randomUUID(),
      buyerName: form.buyerName,
      industry: form.industry,
      dataScope: form.dataScope,
      updateFrequency: form.updateFrequency,
      budgetMin: Number(form.budgetMin) || 0,
      budgetMax: Number(form.budgetMax) || 0,
      complianceReqs: form.complianceReqs,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    addDemand(demand);
    setForm(INITIAL_FORM);
  };

  const startEdit = (d: Demand) => {
    setEditingId(d.id);
    setEditForm({ ...d });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId) {
      updateDemand(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确认删除该需求？')) {
      deleteDemand(id);
    }
  };

  const goToMatching = (demandId: string) => {
    navigate(`/matching?demandId=${demandId}`);
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditField = (field: keyof Demand, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div
          className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
          onClick={() => setFormCollapsed(!formCollapsed)}
        >
          <h2 className="section-title">新建需求</h2>
          {formCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>

        {!formCollapsed && (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">买方名称</label>
                <input
                  className="input-field"
                  value={form.buyerName}
                  onChange={(e) => updateField('buyerName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">行业</label>
                <select
                  className="select-field"
                  value={form.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                  required
                >
                  <option value="">请选择</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-navy-700 mb-1">数据范围</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.dataScope}
                  onChange={(e) => updateField('dataScope', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">更新频率</label>
                <select
                  className="select-field"
                  value={form.updateFrequency}
                  onChange={(e) => updateField('updateFrequency', e.target.value)}
                  required
                >
                  <option value="">请选择</option>
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-navy-700 mb-1">预算下限</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.budgetMin}
                    onChange={(e) => updateField('budgetMin', e.target.value)}
                    min={0}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-navy-700 mb-1">预算上限</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.budgetMax}
                    onChange={(e) => updateField('budgetMax', e.target.value)}
                    min={0}
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-navy-700 mb-1">合规要求</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.complianceReqs}
                  onChange={(e) => updateField('complianceReqs', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setForm(INITIAL_FORM)}>
                重置
              </button>
              <button type="submit" className="btn-primary">
                提交需求
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title">需求列表</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500" />
            <input
              className="input-field pl-9"
              placeholder="搜索买方名称或行业..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select-field sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | DemandStatus)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-300 text-left">
                <th className="px-3 py-3 font-medium text-navy-700">买方名称</th>
                <th className="px-3 py-3 font-medium text-navy-700">行业</th>
                <th className="px-3 py-3 font-medium text-navy-700">数据范围</th>
                <th className="px-3 py-3 font-medium text-navy-700">更新频率</th>
                <th className="px-3 py-3 font-medium text-navy-700">预算区间</th>
                <th className="px-3 py-3 font-medium text-navy-700">合规要求</th>
                <th className="px-3 py-3 font-medium text-navy-700">状态</th>
                <th className="px-3 py-3 font-medium text-navy-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-navy-500">
                    暂无需求数据
                  </td>
                </tr>
              )}
              {filtered.map((d) => {
                const isEditing = editingId === d.id;
                const badge = STATUS_BADGE[d.status];

                return (
                  <tr key={d.id} className="border-b border-navy-300/50 hover:bg-navy-200/30">
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          className="input-field"
                          value={editForm.buyerName ?? ''}
                          onChange={(e) => updateEditField('buyerName', e.target.value)}
                        />
                      ) : (
                        d.buyerName
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <select
                          className="select-field"
                          value={editForm.industry ?? ''}
                          onChange={(e) => updateEditField('industry', e.target.value)}
                        >
                          {INDUSTRIES.map((i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      ) : (
                        d.industry
                      )}
                    </td>
                    <td className="px-3 py-3 max-w-[200px] truncate">
                      {isEditing ? (
                        <textarea
                          className="input-field"
                          rows={2}
                          value={editForm.dataScope ?? ''}
                          onChange={(e) => updateEditField('dataScope', e.target.value)}
                        />
                      ) : (
                        <span title={d.dataScope}>{d.dataScope}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <select
                          className="select-field"
                          value={editForm.updateFrequency ?? ''}
                          onChange={(e) => updateEditField('updateFrequency', e.target.value)}
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      ) : (
                        d.updateFrequency
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <input
                            type="number"
                            className="input-field w-20"
                            value={editForm.budgetMin ?? 0}
                            onChange={(e) => updateEditField('budgetMin', Number(e.target.value))}
                          />
                          <span className="self-center">-</span>
                          <input
                            type="number"
                            className="input-field w-20"
                            value={editForm.budgetMax ?? 0}
                            onChange={(e) => updateEditField('budgetMax', Number(e.target.value))}
                          />
                        </div>
                      ) : (
                        `${d.budgetMin} - ${d.budgetMax}`
                      )}
                    </td>
                    <td className="px-3 py-3 max-w-[200px] truncate">
                      {isEditing ? (
                        <textarea
                          className="input-field"
                          rows={2}
                          value={editForm.complianceReqs ?? ''}
                          onChange={(e) => updateEditField('complianceReqs', e.target.value)}
                        />
                      ) : (
                        <span title={d.complianceReqs}>{d.complianceReqs}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={badge.className}>{badge.label}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button className="btn-primary px-2 py-1" onClick={saveEdit}>
                              <Save size={14} />
                            </button>
                            <button className="btn-secondary px-2 py-1" onClick={cancelEdit}>
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-secondary px-2 py-1" onClick={() => startEdit(d)}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn-secondary px-2 py-1 hover:!text-red-600 hover:!border-red-400" onClick={() => handleDelete(d.id)}>
                              <Trash2 size={14} />
                            </button>
                            <button className="btn-primary px-2 py-1" onClick={() => goToMatching(d.id)}>
                              <ArrowRight size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
