import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MapPin, TrendingUp, ChevronRight, X, Loader2, RefreshCw, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { loadUniversities, University } from "../services/database";

interface UniversityDatabasePageProps {
  onNavigate: (page: string) => void;
}

// 格式化數據顯示組件（非JSON格式）
function FormattedJsonData({ data }: { data: University }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderValue = (value: any): string | JSX.Element => {
    if (value === null || value === undefined) return '無';
    if (typeof value === 'boolean') return value ? '是' : '否';
    // 如果是 React 元素，直接返回
    if (value && typeof value === 'object' && '$$typeof' in value) {
      return value;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '無';
      return value.join('、');
    }
    if (typeof value === 'object') {
      // 檢查是否有循環引用
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return '[無法序列化的對象]';
      }
    }
    return String(value);
  };

  const renderTable = (items: Array<{ label: string; value: any }>) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-gray-200">
            {items.map((item, index) => {
              const renderedValue = renderValue(item.value);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-[14px] font-medium text-gray-700 bg-gray-50 w-1/3">
                    {item.label}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-gray-900">
                    {typeof renderedValue === 'string' ? renderedValue : renderedValue}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const sections: Array<{ key: string; title: string; content: JSX.Element | null }> = [
    {
      key: 'basic',
      title: '基本信息',
      content: renderTable([
        { label: '文檔ID', value: data.id },
        { label: '大學名稱', value: data.name },
        { label: '英文名稱', value: data.nameEn },
        { label: '類型', value: data.type === 'PUBLIC' ? '公立' : data.type === 'PRIVATE' ? '私立' : data.type },
        { label: '城市', value: data.city },
        { label: '區域', value: data.district },
        { label: '地址', value: data.address },
        { label: '創立年份', value: data.founded },
        { label: '網站', value: data.website ? <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{data.website}</a> : '無' },
      ])
    },
    {
      key: 'contact',
      title: '聯繫信息',
      content: data.contact ? renderTable([
        { label: '電子郵件', value: data.contact.email },
        { label: '電話', value: data.contact.phone },
        { label: '傳真', value: data.contact.fax },
      ]) : null
    },
    {
      key: 'admission',
      title: '錄取信息',
      content: data.admission_scores ? renderTable([
        { label: '最低錄取分數', value: data.admission_scores.admission_min },
        { label: '等級', value: data.admission_scores.tier },
      ]) : null
    },
    {
      key: 'ranking',
      title: '排名信息',
      content: data.ranking ? renderTable([
        { label: '國內排名', value: data.ranking.domestic },
        { label: 'QS排名', value: data.ranking.qs },
        { label: '泰晤士排名', value: data.ranking.timesHigherEd },
        { label: '最後更新', value: data.ranking.lastUpdated },
      ]) : null
    },
    {
      key: 'tuition',
      title: '學費信息',
      content: data.tuition ? (
        <div className="space-y-4">
          {data.tuition.undergraduate && (
            <div>
              <h5 className="text-[14px] font-semibold text-gray-700 mb-2">本科生學費</h5>
              {renderTable([
                { label: '貨幣', value: data.tuition.undergraduate.currency },
                { label: '每年', value: data.tuition.undergraduate.perYear },
                { label: '每學期', value: data.tuition.undergraduate.perSemester },
              ])}
            </div>
          )}
          {data.tuition.graduate && (
            <div>
              <h5 className="text-[14px] font-semibold text-gray-700 mb-2">研究生學費</h5>
              {renderTable([
                { label: '貨幣', value: data.tuition.graduate.currency },
                { label: '每年', value: data.tuition.graduate.perYear },
                { label: '每學期', value: data.tuition.graduate.perSemester },
              ])}
            </div>
          )}
        </div>
      ) : null
    },
    {
      key: 'description',
      title: '描述信息',
      content: (data.introduction || data.description || data.about) ? renderTable([
        { label: '介紹', value: data.introduction },
        { label: '描述', value: data.description },
        { label: '關於', value: data.about },
      ]) : null
    },
    {
      key: 'statistics',
      title: '統計數據',
      content: data.statistics ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-[13px] text-gray-700 font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(data.statistics, null, 2)}
          </pre>
        </div>
      ) : null
    },
    {
      key: 'other',
      title: '其他數據',
      content: (() => {
        const otherFields = Object.keys(data).filter(key => 
          !['id', 'name', 'nameEn', 'type', 'city', 'district', 'address', 'founded', 'website',
            'contact', 'admission_scores', 'ranking', 'tuition', 'majors', 'disciplines',
            'department', 'department_introduction', 'introduction', 'description', 'about',
            'metadata', 'statistics', 'name_en'].includes(key)
        );
        if (otherFields.length === 0) return null;
        return renderTable(
          otherFields.map(key => ({
            label: key,
            value: (data as any)[key]
          }))
        );
      })()
    }
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        if (!section.content) return null;
        
        const isExpanded = expandedSections.has(section.key);
        
        return (
          <div key={section.key} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <span className="text-[15px] font-semibold text-gray-900">{section.title}</span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <div className="p-4">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function UniversityDatabasePage({ onNavigate }: UniversityDatabasePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // 记录浏览历史
  useEffect(() => {
    if (selectedUniversity && universities.length > 0) {
      const viewed = JSON.parse(localStorage.getItem('viewed_universities') || '[]');
      const university = universities.find(u => u.id === selectedUniversity);
      if (university && !viewed.find((v: any) => v.id === selectedUniversity)) {
        viewed.push({ id: selectedUniversity, name: university.name, viewedAt: new Date().toISOString() });
        localStorage.setItem('viewed_universities', JSON.stringify(viewed));
      }
    }
  }, [selectedUniversity, universities]);

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('開始載入大學資料...');
      const data = await loadUniversities();
      console.log(`前端收到 ${data.length} 個大學文檔`);
      
      // 調試：顯示第一個文檔的詳細信息
      if (data.length > 0) {
        console.log('第一個文檔示例:', JSON.stringify(data[0], null, 2));
        console.log('系所介紹字段:', {
          department_introduction: data[0].department_introduction,
          introduction: data[0].introduction,
          description: data[0].description,
          about: data[0].about,
        });
      }
      
      setUniversities(data);
      console.log(`已設置 ${data.length} 個大學到狀態`);
    } catch (err) {
      console.error('Failed to load universities:', err);
      setError('載入大學資料失敗，請檢查資料庫配置');
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

  // 檢查大學是否包含某個專業
  const universityHasMajor = (uni: University, majorName: string): boolean => {
    const majorLower = majorName.toLowerCase();
    
    // 檢查 metadata.disciplines
    if (uni.metadata && typeof uni.metadata === 'object' && uni.metadata !== null) {
      const metadataDisciplines = (uni.metadata as any).disciplines;
      if (Array.isArray(metadataDisciplines)) {
        if (metadataDisciplines.some((d: any) => String(d).toLowerCase().includes(majorLower))) {
          return true;
        }
      }
    }
    
    // 檢查 disciplines
    if (uni.disciplines && Array.isArray(uni.disciplines)) {
      if (uni.disciplines.some(d => String(d).toLowerCase().includes(majorLower))) {
        return true;
      }
    }
    
    // 檢查 majors
    if (uni.majors && Array.isArray(uni.majors)) {
      if (uni.majors.some(m => String(m).toLowerCase().includes(majorLower))) {
        return true;
      }
    }
    
    return false;
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
    // 使用新的數據結構
    const admissionMin = uni.admission_scores?.admission_min;
    const scoreDisplay = admissionMin ? `${admissionMin}` : (uni.score || "N/A");
    
    // 獲取系所介紹，優先使用 department_introduction，然後是 introduction、description、about
    // 如果都沒有，嘗試從 metadata 中獲取
    let departmentIntro = uni.department_introduction || 
                         uni.introduction || 
                         uni.description || 
                         uni.about || 
                         "";
    
    // 如果還是沒有，嘗試從 metadata 中獲取
    if (!departmentIntro && uni.metadata) {
      if (typeof uni.metadata === 'string') {
        departmentIntro = uni.metadata;
      } else if (typeof uni.metadata === 'object' && uni.metadata !== null) {
        // 嘗試從 metadata 對象中獲取描述字段
        departmentIntro = uni.metadata.description || 
                         uni.metadata.introduction || 
                         uni.metadata.about ||
                         uni.metadata.department_introduction ||
                         '';
        
        // 如果 metadata 有 disciplines 數組，可以生成簡介
        if (!departmentIntro && Array.isArray(uni.metadata.disciplines) && uni.metadata.disciplines.length > 0) {
          departmentIntro = `本校設有以下專業領域：${uni.metadata.disciplines.slice(0, 5).join('、')}${uni.metadata.disciplines.length > 5 ? '等' : ''}。`;
        }
      }
    }
    
    // 如果還是沒有，使用 disciplines 數組生成簡介
    if (!departmentIntro && uni.disciplines && uni.disciplines.length > 0) {
      departmentIntro = `本校設有以下專業領域：${uni.disciplines.slice(0, 5).join('、')}${uni.disciplines.length > 5 ? '等' : ''}。`;
    }
    
    // 如果還是沒有，使用 majors 數組生成簡介
    if (!departmentIntro && uni.majors && uni.majors.length > 0) {
      departmentIntro = `本校設有以下專業：${uni.majors.slice(0, 5).join('、')}${uni.majors.length > 5 ? '等' : ''}。`;
    }
    
    // 從 statistics 對象中獲取 quota 和 competition，如果不存在則使用直接字段
    const quota = uni.quota || 
                  (uni.statistics && typeof uni.statistics === 'object' && uni.statistics.quota) || 
                  0;
    const competition = uni.competition || 
                       (uni.statistics && typeof uni.statistics === 'object' && uni.statistics.competition) || 
                       0;
    
    return {
      name: uni.name || uni.nameEn || "未知大學",
      nameEn: uni.nameEn || uni.name_en || "",
      department: uni.department || (uni.majors && uni.majors.length > 0 ? uni.majors[0] : "未指定科系"),
      departmentIntroduction: departmentIntro,
      location: uni.city || "未知地區",
      district: uni.district || "",
      address: uni.address || "",
      score: scoreDisplay,
      tag: uni.type === "PUBLIC" ? "公立" : (uni.type === "PRIVATE" ? "私立" : uni.type || "未知"),
      color: uni.type === "PUBLIC" ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50",
      quota: quota,
      competition: competition,
      // 新字段 - 整合所有專業和學科
      majors: (() => {
        const allMajors: string[] = [];
        
        // 從 metadata.disciplines 獲取學科（作為專業顯示）
        if (uni.metadata && typeof uni.metadata === 'object' && uni.metadata !== null) {
          const metadataDisciplines = (uni.metadata as any).disciplines;
          if (Array.isArray(metadataDisciplines) && metadataDisciplines.length > 0) {
            allMajors.push(...metadataDisciplines.map((d: any) => String(d)));
          }
        }
        
        // 從 data.disciplines 獲取學科（去重）
        if (uni.disciplines && Array.isArray(uni.disciplines) && uni.disciplines.length > 0) {
          uni.disciplines.forEach(d => {
            const str = String(d);
            if (!allMajors.includes(str)) {
              allMajors.push(str);
            }
          });
        }
        
        // 從 data.majors 獲取專業（去重）
        if (uni.majors && Array.isArray(uni.majors) && uni.majors.length > 0) {
          uni.majors.forEach(m => {
            const str = String(m);
            if (!allMajors.includes(str)) {
              allMajors.push(str);
            }
          });
        }
        
        return allMajors;
      })(),
      disciplines: uni.disciplines || [],
      contact: uni.contact,
      ranking: uni.ranking,
      tuition: uni.tuition,
      founded: uni.founded,
      website: uni.website,
      admission_scores: uni.admission_scores,
      statistics: uni.statistics,
    };
  };

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
                    {/* 顯示整理後的JSON數據 */}
                    <div>
                      <h4 className="text-[16px] text-gray-700 mb-3 font-semibold">完整數據 (JSON)</h4>
                      <FormattedJsonData data={university} />
                    </div>
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
                <Button 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-6"
                  onClick={() => {
                    // 添加到收藏
                    const favorites = JSON.parse(localStorage.getItem('favorite_universities') || '[]');
                    if (!favorites.find((fav: any) => fav.id === displayData.id)) {
                      favorites.push({ id: displayData.id, name: displayData.name, addedAt: new Date().toISOString() });
                      localStorage.setItem('favorite_universities', JSON.stringify(favorites));
                      alert('已加入收藏');
                    } else {
                      alert('已在收藏列表中');
                    }
                  }}
                >
                  加入收藏
                </Button>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[32px] text-gray-900 mb-2">大學資料庫</h1>
              <p className="text-[16px] text-gray-600">探索適合您的大學與科系</p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>功能說明</span>
              {showInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {/* 功能說明卡片 */}
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6 mb-4"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                功能說明
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>🔍 智能搜尋：</strong>支援大學名稱、科系名稱、城市等關鍵字搜尋。輸入關鍵字後點擊搜尋按鈕或按Enter鍵即可搜尋。</p>
                <p><strong>🏫 詳細大學資訊：</strong>顯示大學基本資訊、聯繫方式、錄取分數、科系資訊等。包含基本資訊、聯繫資訊、錄取資訊、科系資訊、校園設施等詳細資料。</p>
                <p><strong>📊 資料展示：</strong>以表格形式清晰展示各項資訊。可展開/收起各資訊區塊，方便查看。</p>
                <p><strong>⭐ 收藏功能：</strong>可收藏感興趣的大學（需登入）。收藏的大學會在個人資料中顯示。</p>
                <p className="mt-3 text-xs text-blue-600"><strong>💡 提示：</strong>資料來源於Firebase，確保網路連線正常。部分大學可能缺少某些資訊欄位。</p>
              </div>
            </motion.div>
          )}
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
                  placeholder="搜尋學校名稱或地區..."
                  className="pl-12 pr-10 h-12 bg-gray-50 border-gray-200 rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedUniversity(null);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
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
          <div className="flex items-center gap-3">
            <p className="text-[15px] text-gray-600">
              {loading ? "載入中..." : `共找到 ${filteredUniversities.length} 筆結果`}
            </p>
            {searchQuery && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[13px] flex items-center gap-2">
                搜尋：{searchQuery}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedUniversity(null);
                  }}
                  className="hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
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
                  <h3 className="text-[18px] text-gray-900 mb-4">
                    {displayData.name}
                  </h3>
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
