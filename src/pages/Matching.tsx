import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Star, Tag, FileText, Trash2, Plus, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { MatchResult, MatchStatus } from '@/types';

const STATUS_MAP: Record<MatchStatus, { label: string; className: string }> = {
  candidate: { label: '候选', className: 'badge-navy' },
  shortlisted: { label: '入围', className: 'badge-amber' },
  recommended: { label: '推荐', className: 'badge-emerald' },
  rejected: { label: '淘汰', className: 'badge-red' },
};

function scoreColor(score: number): string {
  if (score <= 40) return 'text-red-500';
  if (score <= 70) return 'text-amber-500';
  return 'text-emerald-500';
}

function scoreBg(score: number): string {
  if (score <= 40) return 'bg-red-500';
  if (score <= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

const DIMENSIONS = [
  { key: 'scoreDataScope' as const, label: '数据范围匹配' },
  { key: 'scoreFrequency' as const, label: '更新频率匹配' },
  { key: 'scorePrice' as const, label: '价格匹配' },
  { key: 'scoreCompliance' as const, label: '合规匹配' },
];

export default function Matching() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    demands,
    products,
    matchResults,
    selectedDemandId,
    setSelectedDemandId,
    updateMatchResult,
    deleteMatchResult,
    getProductById,
    getDemandById,
    calculateMatchScore,
    addBulkMatchResults,
    findMatchResult,
  } = useAppStore();

  const [scoringTarget, setScoringTarget] = useState<MatchResult | null>(null);
  const [markingTarget, setMarkingTarget] = useState<MatchResult | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [smartRecommendOpen, setSmartRecommendOpen] = useState(false);
  const [recommendThreshold, setRecommendThreshold] = useState(60);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const [scores, setScores] = useState({ scoreDataScope: 0, scoreFrequency: 0, scorePrice: 0, scoreCompliance: 0 });
  const [markedPrice, setMarkedPrice] = useState('');
  const [markedDelivery, setMarkedDelivery] = useState('');
  const [markedRestrictions, setMarkedRestrictions] = useState('');
  const [statusSelect, setStatusSelect] = useState<MatchStatus>('candidate');

  useEffect(() => {
    const demandId = searchParams.get('demandId');
    if (demandId) {
      setSelectedDemandId(demandId);
    }
  }, [searchParams, setSelectedDemandId]);

  const currentDemandId = selectedDemandId ?? (demands.length > 0 ? demands[0].id : null);

  const candidates = useMemo(() => {
    if (!currentDemandId) return [];
    return matchResults
      .filter((m) => m.demandId === currentDemandId)
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [matchResults, currentDemandId]);

  const currentDemand = useMemo(
    () => demands.find((d) => d.id === currentDemandId),
    [demands, currentDemandId]
  );

  const comparableCandidates = useMemo(
    () => candidates.filter((c) => c.status === 'shortlisted' || c.status === 'recommended'),
    [candidates]
  );

  const smartRecommendations = useMemo(() => {
    if (!currentDemand) return [];
    return products
      .map((product) => {
        const existing = findMatchResult(currentDemand.id, product.id);
        return {
          product,
          matchResult: existing || calculateMatchScore(currentDemand, product),
          isExisting: !!existing,
        };
      })
      .filter((item) => item.matchResult.totalScore >= recommendThreshold)
      .sort((a, b) => b.matchResult.totalScore - a.matchResult.totalScore);
  }, [currentDemand, products, recommendThreshold, calculateMatchScore, findMatchResult]);

  const handleAddAllHighScore = useCallback(() => {
    if (!currentDemand) return;
    const toAdd = smartRecommendations
      .filter((item) => !item.isExisting)
      .map((item) => item.matchResult);
    if (toAdd.length === 0) {
      setToast({ message: '没有新的产品可添加，所有推荐产品已在候选列表中', type: 'warning' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    addBulkMatchResults(toAdd);
    setToast({ message: `已成功添加 ${toAdd.length} 个高分产品到候选列表！`, type: 'success' });
    setTimeout(() => setToast(null), 3000);
    setSmartRecommendOpen(false);
  }, [currentDemand, smartRecommendations, addBulkMatchResults]);

  const handleDemandChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value || null;
      setSelectedDemandId(id);
    },
    [setSelectedDemandId]
  );

  const openScoring = useCallback((mr: MatchResult) => {
    setScores({
      scoreDataScope: mr.scoreDataScope,
      scoreFrequency: mr.scoreFrequency,
      scorePrice: mr.scorePrice,
      scoreCompliance: mr.scoreCompliance,
    });
    setScoringTarget(mr);
  }, []);

  const saveScoring = useCallback(() => {
    if (!scoringTarget) return;
    const total = Math.round(
      (scores.scoreDataScope + scores.scoreFrequency + scores.scorePrice + scores.scoreCompliance) / 4
    );
    updateMatchResult(scoringTarget.id, { ...scores, totalScore: total });
    setScoringTarget(null);
  }, [scoringTarget, scores, updateMatchResult]);

  const openMarking = useCallback((mr: MatchResult) => {
    setMarkedPrice(mr.markedPrice);
    setMarkedDelivery(mr.markedDelivery);
    setMarkedRestrictions(mr.markedRestrictions);
    setStatusSelect(mr.status);
    setMarkingTarget(mr);
  }, []);

  const saveMarking = useCallback(() => {
    if (!markingTarget) return;
    updateMatchResult(markingTarget.id, {
      markedPrice,
      markedDelivery,
      markedRestrictions,
      status: statusSelect,
    });
    setMarkingTarget(null);
  }, [markingTarget, markedPrice, markedDelivery, markedRestrictions, statusSelect, updateMatchResult]);

  const handleScoreSlider = useCallback((key: keyof typeof scores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  }, []);

  const maxScores = useMemo(() => {
    if (comparableCandidates.length === 0) return {} as Record<string, number>;
    const keys = ['scoreDataScope', 'scoreFrequency', 'scorePrice', 'scoreCompliance', 'totalScore'] as const;
    const result: Record<string, number> = {};
    for (const key of keys) {
      result[key] = Math.max(...comparableCandidates.map((c) => c[key]));
    }
    return result;
  }, [comparableCandidates]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="card p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-navy-700">选择需求</label>
          <select
            className="select-field w-64"
            value={currentDemandId ?? ''}
            onChange={handleDemandChange}
          >
            <option value="">-- 请选择 --</option>
            {demands.map((d) => (
              <option key={d.id} value={d.id}>
                {d.buyerName} - {d.industry}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={() => navigate('/products')}>
            <Plus className="w-4 h-4" />
            从产品库添加
          </button>
          <button
            className="btn-primary bg-emerald-500 hover:bg-emerald-600"
            onClick={() => setSmartRecommendOpen(true)}
            disabled={!currentDemand}
          >
            <Sparkles className="w-4 h-4" />
            智能推荐
          </button>
        </div>

        {currentDemand && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-navy-700">
            <div>
              <span className="font-medium text-navy-900">行业：</span>
              {currentDemand.industry}
            </div>
            <div>
              <span className="font-medium text-navy-900">预算范围：</span>
              {currentDemand.budgetMin} ~ {currentDemand.budgetMax} 万元
            </div>
            <div>
              <span className="font-medium text-navy-900">合规要求：</span>
              {currentDemand.complianceReqs}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="section-title">候选产品列表</h2>
        <button
          className="btn-secondary text-sm"
          onClick={() => setCompareOpen((v) => !v)}
        >
          方案对比
          {compareOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {compareOpen && (
        <div className="card p-5 overflow-x-auto">
          {comparableCandidates.length === 0 ? (
            <p className="text-sm text-navy-500 text-center py-4">
              暂无入围或推荐的候选产品，请先标记产品状态。
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-300 text-left text-navy-700">
                  <th className="py-2 px-3 font-medium">产品名</th>
                  <th className="py-2 px-3 font-medium">数据范围分</th>
                  <th className="py-2 px-3 font-medium">更新频率分</th>
                  <th className="py-2 px-3 font-medium">价格分</th>
                  <th className="py-2 px-3 font-medium">合规分</th>
                  <th className="py-2 px-3 font-medium">总分</th>
                  <th className="py-2 px-3 font-medium">标记价格</th>
                  <th className="py-2 px-3 font-medium">交付周期</th>
                  <th className="py-2 px-3 font-medium">限制条件</th>
                </tr>
              </thead>
              <tbody>
                {comparableCandidates.map((c) => {
                  const product = getProductById(c.productId);
                  return (
                    <tr key={c.id} className="border-b border-navy-300/50">
                      <td className="py-2 px-3 font-medium text-navy-900">
                        {product?.name ?? '-'}
                      </td>
                      {(['scoreDataScope', 'scoreFrequency', 'scorePrice', 'scoreCompliance', 'totalScore'] as const).map(
                        (key) => (
                          <td
                            key={key}
                            className={`py-2 px-3 ${
                              c[key] === maxScores[key] && maxScores[key] > 0
                                ? 'text-emerald-600 font-bold'
                                : ''
                            }`}
                          >
                            {c[key]}
                          </td>
                        )
                      )}
                      <td className="py-2 px-3">{c.markedPrice || '-'}</td>
                      <td className="py-2 px-3">{c.markedDelivery || '-'}</td>
                      <td className="py-2 px-3 max-w-[200px] truncate">{c.markedRestrictions || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="card p-8 text-center text-navy-500">
          {currentDemandId ? '该需求下暂无匹配结果，请从产品库添加。' : '请先选择一个需求。'}
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((mr) => {
            const product = getProductById(mr.productId);
            const statusInfo = STATUS_MAP[mr.status];
            return (
              <div key={mr.id} className="card p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium text-navy-900">{product?.name ?? '未知产品'}</div>
                  <div className="text-sm text-navy-500">{product?.supplier ?? '-'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${scoreBg(mr.totalScore)}`} />
                  <span className={`text-lg font-bold ${scoreColor(mr.totalScore)}`}>
                    {mr.totalScore}
                  </span>
                </div>

                <span className={statusInfo.className}>{statusInfo.label}</span>

                <div className="flex items-center gap-2">
                  <button
                    className="btn-secondary text-xs px-3 py-1.5"
                    onClick={() => openScoring(mr)}
                  >
                    <Star className="w-3.5 h-3.5" />
                    评分
                  </button>
                  <button
                    className="btn-secondary text-xs px-3 py-1.5"
                    onClick={() => openMarking(mr)}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    标记
                  </button>
                  <button
                    className="btn-secondary text-xs px-3 py-1.5"
                    onClick={() => navigate(`/products`)}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    详情
                  </button>
                  <button
                    className="btn-danger text-xs px-3 py-1.5"
                    onClick={() => deleteMatchResult(mr.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {scoringTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50" onClick={() => setScoringTarget(null)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="section-title">评分 — {getProductById(scoringTarget.productId)?.name}</h3>

            {DIMENSIONS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm text-navy-700">
                  <span>{label}</span>
                  <span className={`font-bold ${scoreColor(scores[key])}`}>{scores[key]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scores[key]}
                  onChange={(e) => handleScoreSlider(key, Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            ))}

            <div className="flex justify-between items-center pt-2 border-t border-navy-300/50">
              <span className="text-sm text-navy-700">
                总分：
                <span className={`text-lg font-bold ${scoreColor(Math.round((scores.scoreDataScope + scores.scoreFrequency + scores.scorePrice + scores.scoreCompliance) / 4))}`}>
                  {Math.round((scores.scoreDataScope + scores.scoreFrequency + scores.scorePrice + scores.scoreCompliance) / 4)}
                </span>
              </span>
              <div className="flex gap-3">
                <button className="btn-secondary" onClick={() => setScoringTarget(null)}>取消</button>
                <button className="btn-primary" onClick={saveScoring}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {markingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50" onClick={() => setMarkingTarget(null)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="section-title">标记 — {getProductById(markingTarget.productId)?.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">标记价格</label>
                <input
                  type="text"
                  className="input-field"
                  value={markedPrice}
                  onChange={(e) => setMarkedPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">交付周期</label>
                <input
                  type="text"
                  className="input-field"
                  value={markedDelivery}
                  onChange={(e) => setMarkedDelivery(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">限制条件</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={markedRestrictions}
                  onChange={(e) => setMarkedRestrictions(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">状态</label>
                <select
                  className="select-field"
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value as MatchStatus)}
                >
                  <option value="candidate">候选</option>
                  <option value="shortlisted">入围</option>
                  <option value="recommended">推荐</option>
                  <option value="rejected">淘汰</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-navy-300/50">
              <button className="btn-secondary" onClick={() => setMarkingTarget(null)}>取消</button>
              <button className="btn-primary" onClick={saveMarking}>保存</button>
            </div>
          </div>
        </div>
      )}

      {smartRecommendOpen && currentDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50" onClick={() => setSmartRecommendOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                智能匹配推荐
              </h3>
              <span className="text-sm text-navy-600">基于需求：{currentDemand.buyerName}</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-navy-100 rounded-lg">
              <label className="text-sm font-medium text-navy-700 whitespace-nowrap">最低匹配分：</label>
              <input
                type="range"
                min={0}
                max={100}
                value={recommendThreshold}
                onChange={(e) => setRecommendThreshold(Number(e.target.value))}
                className="flex-1 accent-emerald-500"
              />
              <span className="font-bold text-emerald-600 text-lg w-12 text-right">{recommendThreshold}分</span>
            </div>

            {smartRecommendations.length === 0 ? (
              <div className="text-center py-12 text-navy-500">
                <p>当前没有达到 {recommendThreshold} 分的产品</p>
                <p className="text-sm mt-1">请尝试降低最低匹配分门槛</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-300 text-left">
                        <th className="px-3 py-2 font-medium text-navy-700">产品名</th>
                        <th className="px-3 py-2 font-medium text-navy-700">供应商</th>
                        <th className="px-3 py-2 font-medium text-navy-700">价格</th>
                        <th className="px-3 py-2 font-medium text-navy-700">数据范围分</th>
                        <th className="px-3 py-2 font-medium text-navy-700">更新频率分</th>
                        <th className="px-3 py-2 font-medium text-navy-700">价格分</th>
                        <th className="px-3 py-2 font-medium text-navy-700">合规分</th>
                        <th className="px-3 py-2 font-medium text-navy-700">总分</th>
                        <th className="px-3 py-2 font-medium text-navy-700">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smartRecommendations.map(({ product, matchResult, isExisting }) => (
                        <tr key={product.id} className="border-b border-navy-300/50">
                          <td className="px-3 py-2 font-medium text-navy-900">{product.name}</td>
                          <td className="px-3 py-2 text-navy-600">{product.supplier}</td>
                          <td className="px-3 py-2 text-amber-600 font-medium">¥{(product.price / 10000).toFixed(2)} 万元</td>
                          <td className="px-3 py-2 text-center">{matchResult.scoreDataScope}</td>
                          <td className="px-3 py-2 text-center">{matchResult.scoreFrequency}</td>
                          <td className="px-3 py-2 text-center">{matchResult.scorePrice}</td>
                          <td className="px-3 py-2 text-center">{matchResult.scoreCompliance}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-bold ${scoreColor(matchResult.totalScore)}`}>
                              {matchResult.totalScore}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {isExisting ? (
                              <span className="badge-emerald">已加入</span>
                            ) : (
                              <span className="badge-amber">待添加</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-navy-300/50">
                  <span className="text-sm text-navy-600">
                    共 {smartRecommendations.length} 个推荐产品，
                    其中 {smartRecommendations.filter((x) => x.isExisting).length} 个已在候选列表
                  </span>
                  <div className="flex gap-3">
                    <button className="btn-secondary" onClick={() => setSmartRecommendOpen(false)}>
                      取消
                    </button>
                    <button
                      className="btn-primary bg-emerald-500 hover:bg-emerald-600"
                      onClick={handleAddAllHighScore}
                    >
                      <Zap className="w-4 h-4" />
                      一键添加全部高分产品
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-navy-700 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
