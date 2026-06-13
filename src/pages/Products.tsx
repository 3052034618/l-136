import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { allTags } from '@/data/mockProducts';
import { useAppStore } from '@/store/useAppStore';
import type { Product, MatchResult } from '@/types';

export default function Products() {
  const navigate = useNavigate();
  const { products, selectedTags, setSelectedTags, selectedDemandId, addMatchResult, findMatchResult, getDemandById, calculateMatchScore } = useAppStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearTags = () => setSelectedTags([]);

  const filteredProducts = selectedTags.length > 0
    ? products.filter((p) => p.tags.some((t) => selectedTags.includes(t)))
    : products;

  const handleAddCandidate = (product: Product) => {
    if (!selectedDemandId) return;

    const existing = findMatchResult(selectedDemandId, product.id);
    if (existing) {
      setToast({ message: '该产品已在候选列表中，正在跳转至匹配工作台...', type: 'warning' });
      setTimeout(() => {
        navigate(`/matching?demandId=${selectedDemandId}`);
        setToast(null);
      }, 1500);
      return;
    }

    const demand = getDemandById(selectedDemandId);
    let result: MatchResult;

    if (demand) {
      result = calculateMatchScore(demand, product);
      setToast({ message: `已智能计算匹配分 ${result.totalScore}，成功加入候选！`, type: 'success' });
    } else {
      result = {
        id: crypto.randomUUID(),
        demandId: selectedDemandId,
        productId: product.id,
        scoreDataScope: 0,
        scoreFrequency: 0,
        scorePrice: 0,
        scoreCompliance: 0,
        totalScore: 0,
        markedPrice: '',
        markedDelivery: '',
        markedRestrictions: '',
        status: 'candidate',
      };
      setToast({ message: '已成功加入候选！', type: 'success' });
    }

    addMatchResult(result);
    setSelectedProduct(null);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-amber-500 text-white'
                    : 'bg-navy-200 text-navy-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button
              onClick={clearTags}
              className="text-sm text-navy-600 hover:text-amber-600 whitespace-nowrap ml-4"
            >
              清除筛选
            </button>
          )}
        </div>
        <p className="text-sm text-navy-600">共 {filteredProducts.length} 个产品</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card-hover rounded-lg border border-navy-200 bg-white p-4 flex flex-col">
            <h3 className="font-bold text-navy-900">{product.name}</h3>
            <p className="text-navy-600 text-sm mt-1">{product.supplier}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.map((tag) => (
                <span key={tag} className="badge-amber text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <p className="text-sm text-navy-700 line-clamp-2 mt-2">{product.description}</p>
            <p className="text-amber-600 font-bold mt-2">¥{(product.price / 10000).toFixed(2)} 万元</p>
            <p className="text-navy-600 text-sm">{product.deliveryCycle}</p>
            <button
              onClick={() => setSelectedProduct(product)}
              className="mt-3 w-full rounded-md bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              查看详情
            </button>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-navy-950/50 z-40"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 text-navy-600 hover:text-navy-900"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-navy-900 pr-8">{selectedProduct.name}</h2>
              <p className="text-navy-600 mt-1">{selectedProduct.supplier}</p>

              <div className="flex flex-wrap gap-1 mt-3">
                {selectedProduct.tags.map((tag) => (
                  <span key={tag} className="badge-amber text-xs px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-navy-900">描述</p>
                  <p className="text-sm text-navy-700">{selectedProduct.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">数据范围</p>
                  <p className="text-sm text-navy-700">{selectedProduct.dataScope}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">更新频率</p>
                  <p className="text-sm text-navy-700">{selectedProduct.updateFrequency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">价格</p>
                  <p className="text-amber-600 font-bold">¥{(selectedProduct.price / 10000).toFixed(2)} 万元</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">交付周期</p>
                  <p className="text-sm text-navy-700">{selectedProduct.deliveryCycle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">使用限制</p>
                  <p className="text-sm text-navy-700">{selectedProduct.restrictions}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">合规认证</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProduct.complianceCerts.map((cert) => (
                      <span key={cert} className="badge-emerald text-xs px-2 py-0.5 rounded-full">{cert}</span>
                    ))}
                  </div>
                </div>
              </div>

              {selectedDemandId && (
                <button
                  onClick={() => handleAddCandidate(selectedProduct)}
                  className="mt-6 w-full rounded-md bg-amber-500 py-2.5 font-medium text-white hover:bg-amber-600 transition-colors"
                >
                  添加到候选
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'warning' ? 'bg-amber-500 text-white' :
          'bg-navy-700 text-white'
        }`}>
          {toast.type === 'success' && <ArrowRight className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
