import { useState, useEffect } from "react";
import { Search, Filter, MapPin, TrendingUp, ChevronRight, X, Loader2, RefreshCw } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { loadUniversities, University } from "../services/firebase";

interface UniversityDatabasePageProps {
  onNavigate: (page: string) => void;
}

export function UniversityDatabasePage({ onNavigate }: UniversityDatabasePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadUniversities();
      setUniversities(data);
    } catch (err) {
      console.error('Failed to load universities:', err);
      setError('載入大學資料失敗，請檢查Firebase配置');
      // 使用預設資料作為後備
      setUniversities([
        {
          id: "1",
          name: "國立臺灣大學",
          nameEn: "National Taiwan University",
          city: "台北市",
          type: "PUBLIC",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUniversities = universities.filter(uni => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      uni.name?.toLowerCase().includes(query) ||
      uni.nameEn?.toLowerCase().includes(query) ||
      uni.city?.toLowerCase().includes(query)
    );
  });

  const getUniversityDisplayData = (uni: University) => {
    return {
      name: uni.name || "未知大學",
      department: uni.department || "未指定科系",
      location: uni.city || "未知地區",
      score: uni.score || "N/A",
      tag: uni.type === "PUBLIC" ? "公立" : "私立",
      color: uni.type === "PUBLIC" ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50",
      quota: uni.quota || 0,
      competition: uni.competition || 0,
    };
  };
    {
      id: 2,
      name: "國立清華大學",
      department: "電機工程學系",
      location: "新竹市",
      score: "55-58",
      tag: "頂尖",
      color: "text-blue-600 bg-blue-50",
      quota: 50,
      competition: 2.8,
    },
    {
      id: 3,
      name: "國立成功大學",
      department: "企業管理學系",
      location: "台南市",
      score: "50-54",
      tag: "熱門",
      color: "text-purple-600 bg-purple-50",
      quota: 40,
      competition: 3.5,
    },
    {
      id: 4,
      name: "國立政治大學",
      department: "外交學系",
      location: "台北市",
      score: "52-55",
      tag: "推薦",
      color: "text-green-600 bg-green-50",
      quota: 35,
      competition: 2.9,
    },
    {
      id: 5,
      name: "國立交通大學",
      department: "資訊科學系",
      location: "新竹市",
      score: "56-59",
      tag: "頂尖",
      color: "text-blue-600 bg-blue-50",
      quota: 48,
      competition: 3.1,
    },
    {
      id: 6,
      name: "國立中央大學",
      department: "數學系",
      location: "桃園市",
      score: "48-52",
      tag: "推薦",
      color: "text-green-600 bg-green-50",
      quota: 42,
      competition: 2.6,
    },
  ];

  if (selectedUniversity !== null) {
    const university = universities.find(u => u.id === selectedUniversity);
    if (!university) {
      setSelectedUniversity(null);
      return null;
    }
    
    const displayData = getUniversityDisplayData(university);

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[32px] text-gray-900 mb-2">學校詳情</h1>
              <p className="text-[16px] text-gray-600">詳細查看科系資訊</p>
            </div>
            <button
              onClick={() => setSelectedUniversity(null)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* University Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white">
                  <div className={`inline-block px-4 py-1.5 rounded-full text-[13px] mb-4 ${displayData.color}`}>
                    {displayData.tag}
                  </div>
                  <h2 className="text-[32px] mb-3">{displayData.name}</h2>
                  <p className="text-[18px] text-blue-100">{displayData.department}</p>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-[20px] text-gray-900 mb-4">基本資訊</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <MapPin className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="text-[13px] text-gray-500">地區</p>
                          <p className="text-[16px] text-gray-900">{displayData.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-gray-400" />
                        <div>
                          <p className="text-[13px] text-gray-500">錄取分數區間</p>
                          <p className="text-[16px] text-gray-900">{displayData.score} 級分</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-[20px] text-gray-900 mb-4">系所介紹</h3>
                    <p className="text-[16px] text-gray-600 leading-relaxed mb-4">
                      本系致力於培養具備專業知識與實務能力的人才，課程涵蓋理論與實作，
                      並提供完善的研究環境與產學合作機會。畢業生就業率高，深受業界好評。
                    </p>
                    <p className="text-[16px] text-gray-600 leading-relaxed">
                      系上設有多個研究實驗室，包���人工智慧、軟體工程、網路安全等領域，
                      學生可根據興趣選擇專題研究方向，培養專業技能。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mb-6">
                <h3 className="text-[20px] text-gray-900 mb-4">招生資訊</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <p className="text-[13px] text-gray-600 mb-1">招生名額</p>
                    <p className="text-[28px] text-blue-600">{displayData.quota} 人</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4">
                    <p className="text-[13px] text-gray-600 mb-1">競爭倍率</p>
                    <p className="text-[28px] text-purple-600">{displayData.competition} 倍</p>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-4">
                    <p className="text-[13px] text-gray-600 mb-1">錄取率</p>
                    <p className="text-[28px] text-green-600">
                      {displayData.competition > 0 ? Math.round(100 / displayData.competition) : 0}%
                    </p>
                  </div>
                </div>
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-6">
                  加入收藏
                </Button>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl shadow-lg p-6 text-white">
                <h3 className="text-[18px] mb-3">相關科系</h3>
                <div className="space-y-2">
                  <button className="w-full text-left bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 hover:bg-white/30 transition-colors">
                    <p className="text-[15px]">資訊管理學系</p>
                  </button>
                  <button className="w-full text-left bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 hover:bg-white/30 transition-colors">
                    <p className="text-[15px]">電機工程學系</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] text-gray-900 mb-2">大學資料庫</h1>
          <p className="text-[16px] text-gray-600">探索適合您的大學與科系</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋學校或科系..."
                  className="pl-12 pr-4 h-12 bg-gray-50 border-gray-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 border-gray-200 rounded-xl"
              >
                <Filter className="w-5 h-5" />
                <span>篩選條件</span>
              </Button>
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="flex items-center justify-center gap-2 h-12 border-gray-200 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[15px] text-gray-600">
            {loading ? "載入中..." : `共找到 ${filteredUniversities.length} 筆結果`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-gray-500">排序：</span>
            <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900">
              <option>推薦順序</option>
              <option>分數由高至低</option>
              <option>分數由低至高</option>
            </select>
          </div>
        </div>

        {/* University Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUniversities.map((university) => {
              const displayData = getUniversityDisplayData(university);
              return (
                <button
                  key={university.id}
                  onClick={() => setSelectedUniversity(university.id)}
                  className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-[12px] ${displayData.color}`}>
                      {displayData.tag}
                    </span>
                    <span className="text-[13px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {displayData.location}
                    </span>
                  </div>
                  <h3 className="text-[18px] text-gray-900 mb-1">
                    {displayData.name}
                  </h3>
                  <p className="text-[15px] text-gray-600 mb-4">
                    {displayData.department}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-[14px] text-gray-600">
                        {displayData.score} 級分
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
