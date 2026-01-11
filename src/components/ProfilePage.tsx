import { User, Settings, Bell, GraduationCap, LogOut, ChevronRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getUserStats, getSupabaseClient } from "../services/supabase";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  user?: any;
}

export function ProfilePage({ onNavigate, onLogout, user }: ProfilePageProps) {
  const [stats, setStats] = useState({
    usageDays: 0,
    questionnaireCompleted: 0,
    interviewCount: 0,
    favoriteUniversities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [educationInfo, setEducationInfo] = useState({
    school: '氹仔坊眾學校',
    grade: '',
    major: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await getUserStats();
        setStats({
          usageDays: userStats.usageDays || 0,
          questionnaireCompleted: userStats.questionnaireProgress.completed || 0,
          interviewCount: userStats.interviewCount || 0,
          favoriteUniversities: userStats.favoriteUniversities || 0,
        });
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // 加载用户配置（学歷資訊等）
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const saved = localStorage.getItem('user_profile');
        if (saved) {
          const profile = JSON.parse(saved);
          setEducationInfo({
            school: profile.school || '氹仔坊眾學校',
            grade: profile.grade || '',
            major: profile.major || '',
          });
        } else {
          // 如果没有保存的配置，使用默认学校
          setEducationInfo({
            school: '氹仔坊眾學校',
            grade: '',
            major: '',
          });
        }
      } catch (error) {
        console.error('加载用户配置失败:', error);
      }
    };

    loadUserProfile();
  }, []);

  // 打开编辑对话框
  const handleOpenEdit = () => {
    setShowEditDialog(true);
  };

  // 保存个人资料
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // 保存到localStorage
      const profile = {
        school: educationInfo.school,
        grade: educationInfo.grade,
        major: educationInfo.major,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('user_profile', JSON.stringify(profile));
      
      // 也可以选择保存到Supabase user_metadata（如果需要跨设备同步）
      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.auth.updateUser({
          data: {
            education: profile,
          },
        });
      }
      
      setShowEditDialog(false);
    } catch (error) {
      console.error('保存个人资料失败:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };
  // 優先使用 Google 用戶名稱，按順序嘗試不同的字段
  const userName = 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    (user?.user_metadata?.given_name && user?.user_metadata?.family_name 
      ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}` 
      : null) ||
    user?.user_metadata?.given_name ||
    user?.email?.split('@')[0] || 
    '用戶';
  
  const userEmail = user?.email || 'student@email.com';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const menuSections = [
    {
      title: "個人資料",
      items: [
        { icon: User, label: "編輯個人資料", value: userName, color: "text-blue-600" },
        { icon: GraduationCap, label: "學歷資訊", value: "", color: "text-purple-600" },
      ],
    },
    {
      title: "偏好設定",
      items: [
        { icon: Bell, label: "通知設定", value: "", color: "text-green-600" },
        { icon: Settings, label: "應用程式設定", value: "", color: "text-orange-600" },
      ],
    },
  ];

  const statsData = [
    { label: "使用天數", value: loading ? "..." : String(stats.usageDays), color: "from-blue-500 to-blue-600" },
    { label: "完成問卷", value: loading ? "..." : String(stats.questionnaireCompleted), color: "from-purple-500 to-purple-600" },
    { label: "面試練習", value: loading ? "..." : String(stats.interviewCount), color: "from-green-500 to-green-600" },
    { label: "收藏學校", value: loading ? "..." : String(stats.favoriteUniversities), color: "from-orange-500 to-orange-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] text-gray-900 mb-2">個人資料</h1>
          <p className="text-[16px] text-gray-600">管理您的帳號與偏好設定</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-6">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName}
                className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-[28px] text-white mb-2">{userName}</h2>
              <p className="text-[16px] text-blue-100">{userEmail}</p>
            </div>
            <button 
              onClick={handleOpenEdit}
              className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              編輯個人資料
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br ${stat.color} rounded-3xl p-6 text-white shadow-lg`}>
              <p className="text-[14px] text-white/80 mb-2">{stat.label}</p>
              <p className="text-[42px]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Sections */}
          <div className="lg:col-span-2 space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-[20px] text-gray-900 mb-4">{section.title}</h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={item.label === "編輯個人資料" ? handleOpenEdit : undefined}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors"
                      >
                        <div className={`w-12 h-12 ${item.color.replace("text-", "bg-").replace("600", "100")} rounded-xl flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[16px] text-gray-900">{item.label}</p>
                          {item.value && (
                            <p className="text-[14px] text-gray-500">{item.value}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-[20px] text-gray-900 mb-4">應用資訊</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-[15px] text-gray-600">版本</span>
                  <span className="text-[15px] text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[15px] text-gray-600">最後更新</span>
                  <span className="text-[15px] text-gray-900">2026/01/04</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[15px] text-gray-600">資料同步</span>
                  <span className="text-[15px] text-green-600">已同步</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-lg p-6 text-white">
              <h3 className="text-[20px] mb-3">升級方案</h3>
              <p className="text-[14px] text-purple-100 mb-4">
                升級為進階會員，享受更多專屬功能與服務
              </p>
              <button className="w-full bg-white text-purple-600 hover:bg-purple-50 rounded-xl py-3 transition-colors">
                了解更多
              </button>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 p-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[16px]">登出帳號</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[14px] text-gray-400 mt-8">
          © 2026 AI 升學輔助 All Rights Reserved
        </p>
      </div>

      {/* 编辑个人资料对话框 */}
      {showEditDialog && (
        <>
          {/* 遮罩层 - 覆盖整个屏幕 */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100]" 
            onClick={() => setShowEditDialog(false)}
          />
          {/* 对话框内容 - 只在主内容区域显示 */}
          <div className="fixed top-0 bottom-0 left-0 right-0 z-[101] flex items-center justify-center pointer-events-none md:left-64">
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 m-4 flex flex-col pointer-events-auto"
              style={{ backgroundColor: 'white', color: '#1a202c', maxWidth: '512px' }}
              onClick={(e) => e.stopPropagation()}
            >
            <button
              onClick={() => setShowEditDialog(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="mb-6 flex-shrink-0">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">編輯個人資料</h2>
              <p className="text-gray-600">
                更新您的個人資訊（姓名來自Google帳戶，無法修改）
              </p>
            </div>
          
            <div className="space-y-6 py-4 flex-1 overflow-y-auto min-h-0">
            {/* 姓名（只读，来自Google） */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">姓名</Label>
              <Input
                id="name"
                value={userName}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500">姓名來自Google帳戶，無法修改</p>
            </div>

            {/* 邮箱（只读，来自Google） */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">電子郵件</Label>
              <Input
                id="email"
                value={userEmail}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500">電子郵件來自Google帳戶，無法修改</p>
            </div>

            {/* 學歷資訊 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">學歷資訊</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school" className="text-base font-medium">學校</Label>
                  <Input
                    id="school"
                    value={educationInfo.school}
                    disabled
                    className="bg-gray-100 cursor-not-allowed text-base"
                  />
                  <p className="text-sm text-gray-500">學校已預設為氹仔坊眾學校，無法修改</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-base font-medium">年級</Label>
                  <Input
                    id="grade"
                    value={educationInfo.grade}
                    onChange={(e) => setEducationInfo({ ...educationInfo, grade: e.target.value })}
                    placeholder="例如：高三、大一等"
                    className="text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="major" className="text-base font-medium">科系/專長</Label>
                  <Input
                    id="major"
                    value={educationInfo.major}
                    onChange={(e) => setEducationInfo({ ...educationInfo, major: e.target.value })}
                    placeholder="請輸入科系或專長領域"
                    className="text-base"
                  />
                </div>
              </div>
            </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}