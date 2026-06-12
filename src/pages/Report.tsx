import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { MatchResult } from '@/types';
import {
  FileDown,
  Printer,
  ChevronDown,
  Trophy,
  Package,
  Clock,
  DollarSign,
  ClipboardList,
} from 'lucide-react';

function getMedalColor(rank: number) {
  if (rank === 1) return 'bg-amber-500 text-white';
  if (rank === 2) return 'bg-navy-700 text-white';
  if (rank === 3) return 'bg-orange-500 text-white';
  return 'bg-navy-300 text-navy-700';
}

function getMedalBorder(rank: number) {
  if (rank === 1) return 'border-amber-400';
  if (rank === 2) return 'border-navy-600';
  if (rank === 3) return 'border-orange-400';
  return 'border-navy-300';
}

function statusBadge(status: MatchResult['status']) {
  if (status === 'recommended')
    return <span className="badge-amber">推荐</span>;
  if (status === 'shortlisted')
    return <span className="badge-emerald">入围</span>;
  if (status === 'candidate')
    return <span className="badge-navy">候选</span>;
  return <span className="badge-red">已拒绝</span>;
}

function scoreBar(score: number, color = 'bg-amber-500') {
  return (
    <div className="w-full bg-navy-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-300`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function Report() {
  const {
    demands,
    getMatchResultsByDemand,
    getDemandById,
    getProductById,
    getCommunicationsByDemand,
  } = useAppStore();

  const [selectedDemandId, setSelectedDemandId] = useState<string>('');

  const selectedDemand = selectedDemandId
    ? getDemandById(selectedDemandId)
    : null;

  const allMatchResults = selectedDemandId
    ? getMatchResultsByDemand(selectedDemandId)
    : [];

  const recommendedResults = useMemo(
    () =>
      allMatchResults
        .filter(
          (m) => m.status === 'recommended' || m.status === 'shortlisted'
        )
        .sort((a, b) => b.totalScore - a.totalScore),
    [allMatchResults]
  );

  const communications = selectedDemandId
    ? getCommunicationsByDemand(selectedDemandId)
    : [];

  const latestFollowUp = communications.length
    ? communications.reduce((latest, c) =>
        c.nextFollowUpDate > latest.nextFollowUpDate ? c : latest
      ).nextFollowUpDate
    : '';

  function exportHTML() {
    if (!selectedDemand || !recommendedResults.length) return;

    const rows = recommendedResults
      .map(
        (r, i) => `
      <tr${i === 0 ? ' style="background:#FEF3C7"' : ''}>
        <td style="border:1px solid #E2E8F0;padding:8px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #E2E8F0;padding:8px">${getProductById(r.productId)?.name || ''}</td>
        <td style="border:1px solid #E2E8F0;padding:8px">${getProductById(r.productId)?.supplier || ''}</td>
        <td style="border:1px solid #E2E8F0;padding:8px;text-align:center">${r.scoreDataScope}</td>
        <td style="border:1px solid #E2E8F0;padding:8px;text-align:center">${r.scoreFrequency}</td>
        <td style="border:1px solid #E2E8F0;padding:8px;text-align:center">${r.scorePrice}</td>
        <td style="border:1px solid #E2E8F0;padding:8px;text-align:center">${r.scoreCompliance}</td>
        <td style="border:1px solid #E2E8F0;padding:8px;text-align:center;font-weight:bold">${r.totalScore}</td>
        <td style="border:1px solid #E2E8F0;padding:8px">${r.markedPrice}</td>
        <td style="border:1px solid #E2E8F0;padding:8px">${r.markedDelivery}</td>
        <td style="border:1px solid #E2E8F0;padding:8px">${r.markedRestrictions}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>数据要素供需撮合报告</title>
<style>
body{font-family:'Noto Sans SC',system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#0F172A}
h1{text-align:center;font-size:24px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;margin:16px 0}
th{background:#F1F5F9;border:1px solid #E2E8F0;padding:8px;font-size:13px}
td{font-size:13px}
.section{margin:20px 0}
.section h2{font-size:16px;margin-bottom:8px;border-bottom:2px solid #F59E0B;padding-bottom:4px}
.info-row{display:flex;gap:16px;margin:4px 0;font-size:14px}
.info-label{color:#64748B;min-width:100px}
.footer{margin-top:32px;text-align:center;color:#94A3B8;font-size:12px}
</style>
</head>
<body>
<h1>数据要素供需撮合报告</h1>
<div class="section">
<h2>买方信息</h2>
<div class="info-row"><span class="info-label">买方名称:</span><span>${selectedDemand.buyerName}</span></div>
<div class="info-row"><span class="info-label">行业:</span><span>${selectedDemand.industry}</span></div>
<div class="info-row"><span class="info-label">数据范围:</span><span>${selectedDemand.dataScope}</span></div>
<div class="info-row"><span class="info-label">更新频率:</span><span>${selectedDemand.updateFrequency}</span></div>
<div class="info-row"><span class="info-label">预算区间:</span><span>${selectedDemand.budgetMin}-${selectedDemand.budgetMax} 元</span></div>
<div class="info-row"><span class="info-label">合规要求:</span><span>${selectedDemand.complianceReqs}</span></div>
</div>
<div class="section">
<h2>推荐清单</h2>
<table>
<thead>
<tr><th>排名</th><th>产品名称</th><th>供应商</th><th>数据范围分</th><th>更新频率分</th><th>价格分</th><th>合规分</th><th>总分</th><th>标记价格</th><th>交付周期</th><th>限制条件</th></tr>
</thead>
<tbody>${rows}</tbody>
</table>
</div>
<div class="section">
<h2>沟通摘要</h2>
<p>沟通次数: ${communications.length}</p>
${latestFollowUp ? `<p>最近跟进日期: ${latestFollowUp}</p>` : ''}
</div>
<div class="footer">
<p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
<p>由数据撮合平台自动生成</p>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `撮合报告_${selectedDemand.buyerName}_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  return (
    <div className="space-y-6 print:p-0">
      <div className="card p-5">
        <label className="block text-sm font-medium text-navy-700 mb-2">
          选择需求
        </label>
        <div className="relative">
          <select
            className="select-field pr-10"
            value={selectedDemandId}
            onChange={(e) => setSelectedDemandId(e.target.value)}
          >
            <option value="">-- 请选择需求 --</option>
            {demands.map((d) => (
              <option key={d.id} value={d.id}>
                {d.buyerName} - {d.industry} ({d.dataScope})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500 pointer-events-none" />
        </div>

        {selectedDemand && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-navy-500">买方名称: </span>
              <span className="font-medium">{selectedDemand.buyerName}</span>
            </div>
            <div>
              <span className="text-navy-500">行业: </span>
              <span className="font-medium">{selectedDemand.industry}</span>
            </div>
            <div>
              <span className="text-navy-500">数据范围: </span>
              <span className="font-medium">{selectedDemand.dataScope}</span>
            </div>
            <div>
              <span className="text-navy-500">更新频率: </span>
              <span className="font-medium">
                {selectedDemand.updateFrequency}
              </span>
            </div>
            <div>
              <span className="text-navy-500">预算区间: </span>
              <span className="font-medium">
                {selectedDemand.budgetMin}-{selectedDemand.budgetMax} 元
              </span>
            </div>
            <div>
              <span className="text-navy-500">合规要求: </span>
              <span className="font-medium">
                {selectedDemand.complianceReqs}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          推荐清单
        </h2>

        {recommendedResults.length === 0 ? (
          <div className="text-center py-12 text-navy-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-navy-400" />
            <p>暂无推荐或入围的匹配结果</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendedResults.map((result, index) => {
              const product = getProductById(result.productId);
              const rank = index + 1;
              return (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${getMedalBorder(rank)}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${getMedalColor(rank)}`}
                    >
                      {rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-navy-950">
                          {product?.name}
                        </span>
                        <span className="text-navy-500 text-sm">
                          {product?.supplier}
                        </span>
                        {statusBadge(result.status)}
                      </div>

                      <div className="mb-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-navy-600">总分</span>
                          <span className="font-bold text-amber-600">
                            {result.totalScore}
                          </span>
                        </div>
                        {scoreBar(result.totalScore, 'bg-amber-500')}
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[
                          {
                            label: '数据范围',
                            score: result.scoreDataScope,
                            color: 'bg-blue-500',
                          },
                          {
                            label: '更新频率',
                            score: result.scoreFrequency,
                            color: 'bg-emerald-500',
                          },
                          {
                            label: '价格',
                            score: result.scorePrice,
                            color: 'bg-amber-500',
                          },
                          {
                            label: '合规',
                            score: result.scoreCompliance,
                            color: 'bg-purple-500',
                          },
                        ].map((dim) => (
                          <div key={dim.label}>
                            <div className="flex items-center justify-between text-xs text-navy-500 mb-0.5">
                              <span>{dim.label}</span>
                              <span>{dim.score}</span>
                            </div>
                            {scoreBar(dim.score, dim.color)}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-navy-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {result.markedPrice}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {result.markedDelivery}
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

      {recommendedResults.length > 0 && (
        <div className="card p-5 overflow-x-auto print:hidden">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-amber-500" />
            对比表
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-200">
                <th className="px-3 py-2 text-left font-medium">排名</th>
                <th className="px-3 py-2 text-left font-medium">产品名称</th>
                <th className="px-3 py-2 text-left font-medium">供应商</th>
                <th className="px-3 py-2 text-center font-medium">
                  数据范围分
                </th>
                <th className="px-3 py-2 text-center font-medium">
                  更新频率分
                </th>
                <th className="px-3 py-2 text-center font-medium">价格分</th>
                <th className="px-3 py-2 text-center font-medium">合规分</th>
                <th className="px-3 py-2 text-center font-medium">总分</th>
                <th className="px-3 py-2 text-left font-medium">标记价格</th>
                <th className="px-3 py-2 text-left font-medium">交付周期</th>
                <th className="px-3 py-2 text-left font-medium">限制条件</th>
              </tr>
            </thead>
            <tbody>
              {recommendedResults.map((result, index) => {
                const product = getProductById(result.productId);
                const isTop = index === 0;
                return (
                  <tr
                    key={result.id}
                    className={
                      isTop ? 'bg-amber-50' : 'hover:bg-navy-100 transition-colors'
                    }
                  >
                    <td className="px-3 py-2 text-center font-bold">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{product?.name}</td>
                    <td className="px-3 py-2 text-navy-600">
                      {product?.supplier}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {result.scoreDataScope}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {result.scoreFrequency}
                    </td>
                    <td className="px-3 py-2 text-center">{result.scorePrice}</td>
                    <td className="px-3 py-2 text-center">
                      {result.scoreCompliance}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-amber-600">
                      {result.totalScore}
                    </td>
                    <td className="px-3 py-2">{result.markedPrice}</td>
                    <td className="px-3 py-2">{result.markedDelivery}</td>
                    <td className="px-3 py-2 text-navy-600">
                      {result.markedRestrictions}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedDemand && recommendedResults.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="section-title flex items-center gap-2">
              <FileDown className="w-5 h-5 text-amber-500" />
              报告预览
            </h2>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm" onClick={exportHTML}>
                <FileDown className="w-4 h-4" />
                导出HTML
              </button>
              <button className="btn-primary text-sm" onClick={exportPDF}>
                <Printer className="w-4 h-4" />
                导出PDF
              </button>
            </div>
          </div>

          <div className="max-w-[800px] mx-auto bg-white shadow-lg p-8 min-h-[600px] border border-navy-300 print:shadow-none print:border-none print:p-0">
            <h1 className="text-2xl font-bold text-center text-navy-950 mb-6">
              数据要素供需撮合报告
            </h1>

            <div className="mb-6">
              <h3 className="text-base font-bold text-navy-800 mb-2 border-b-2 border-amber-400 pb-1">
                买方信息
              </h3>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <div>
                  <span className="text-navy-500">买方名称: </span>
                  <span className="font-medium">
                    {selectedDemand.buyerName}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500">行业: </span>
                  <span className="font-medium">
                    {selectedDemand.industry}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500">数据范围: </span>
                  <span className="font-medium">
                    {selectedDemand.dataScope}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500">更新频率: </span>
                  <span className="font-medium">
                    {selectedDemand.updateFrequency}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500">预算区间: </span>
                  <span className="font-medium">
                    {selectedDemand.budgetMin}-{selectedDemand.budgetMax} 元
                  </span>
                </div>
                <div>
                  <span className="text-navy-500">合规要求: </span>
                  <span className="font-medium">
                    {selectedDemand.complianceReqs}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base font-bold text-navy-800 mb-2 border-b-2 border-amber-400 pb-1">
                推荐清单
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-navy-200">
                      <th className="px-2 py-1.5 text-left">排名</th>
                      <th className="px-2 py-1.5 text-left">产品名称</th>
                      <th className="px-2 py-1.5 text-left">供应商</th>
                      <th className="px-2 py-1.5 text-center">数据范围分</th>
                      <th className="px-2 py-1.5 text-center">更新频率分</th>
                      <th className="px-2 py-1.5 text-center">价格分</th>
                      <th className="px-2 py-1.5 text-center">合规分</th>
                      <th className="px-2 py-1.5 text-center">总分</th>
                      <th className="px-2 py-1.5 text-left">标记价格</th>
                      <th className="px-2 py-1.5 text-left">交付周期</th>
                      <th className="px-2 py-1.5 text-left">限制条件</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendedResults.map((result, index) => {
                      const product = getProductById(result.productId);
                      return (
                        <tr
                          key={result.id}
                          className={
                            index === 0
                              ? 'bg-amber-50'
                              : index % 2 === 0
                              ? 'bg-navy-100'
                              : ''
                          }
                        >
                          <td className="px-2 py-1.5 font-bold">
                            {index + 1}
                          </td>
                          <td className="px-2 py-1.5 font-medium">
                            {product?.name}
                          </td>
                          <td className="px-2 py-1.5">
                            {product?.supplier}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {result.scoreDataScope}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {result.scoreFrequency}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {result.scorePrice}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {result.scoreCompliance}
                          </td>
                          <td className="px-2 py-1.5 text-center font-bold text-amber-600">
                            {result.totalScore}
                          </td>
                          <td className="px-2 py-1.5">
                            {result.markedPrice}
                          </td>
                          <td className="px-2 py-1.5">
                            {result.markedDelivery}
                          </td>
                          <td className="px-2 py-1.5">
                            {result.markedRestrictions}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base font-bold text-navy-800 mb-2 border-b-2 border-amber-400 pb-1">
                沟通摘要
              </h3>
              <p className="text-sm">
                沟通次数: {communications.length}
              </p>
              {latestFollowUp && (
                <p className="text-sm">
                  最近跟进日期: {latestFollowUp}
                </p>
              )}
            </div>

            <div className="text-center text-navy-500 text-xs mt-8 pt-4 border-t border-navy-300">
              <p>报告生成时间: {new Date().toLocaleString('zh-CN')}</p>
              <p>由数据撮合平台自动生成</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
