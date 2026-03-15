import { User, Settings, Bell, GraduationCap, LogOut, ChevronRight, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { getUserStats, getSupabaseClient } from "../services/supabase";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onProfileUpdated: (user: any) => void;
  user?: any;
  mode?: "profile" | "register";
}

interface ProfileFormState {
  name: string;
  school: string;
  grade: string;
  region: string;
  majorPreference: string;
  interests: string;
  desiredMajors: string;
  careerGoals: string;
  preferredRegion: string;
  preferredCountries: string;
  acceptFarFromHome: string;
  budgetPerYear: string;
  needScholarship: string;
  extracurriculars: string;
  awards: string;
  internships: string;
  universityType: string;
  campusEnvironment: string;
  rankingPreference: string;
}

const getInitialProfile = (user?: any): ProfileFormState => {
  const profile = user?.user_metadata?.profile || {};
  const fallbackName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.user_metadata?.given_name && user?.user_metadata?.family_name
      ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}`
      : null) ||
    user?.user_metadata?.given_name ||
    user?.email?.split('@')[0] ||
    '';

  return {
    name: profile.name || fallbackName || '',
    school: profile.school || '',
    grade: profile.grade || '',
    region: profile.region || '',
    majorPreference: profile.majorPreference || '',
    interests: profile.interests || '',
    desiredMajors: profile.desiredMajors || '',
    careerGoals: profile.careerGoals || '',
    preferredRegion: profile.preferredRegion || '',
    preferredCountries: profile.preferredCountries || '',
    acceptFarFromHome: profile.acceptFarFromHome || '',
    budgetPerYear: profile.budgetPerYear || '',
    needScholarship: profile.needScholarship || '',
    extracurriculars: profile.extracurriculars || '',
    awards: profile.awards || '',
    internships: profile.internships || '',
    universityType: profile.universityType || '',
    campusEnvironment: profile.campusEnvironment || '',
    rankingPreference: profile.rankingPreference || '',
  };
};

export function ProfilePage({ onNavigate, onLogout, onProfileUpdated, user, mode = "profile" }: ProfilePageProps) {
  const [stats, setStats] = useState({
    usageDays: 0,
    questionnaireCompleted: 0,
    interviewCount: 0,
    favoriteUniversities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showEditSection, setShowEditSection] = useState(mode === "register");
  const [forceProfileEdit, setForceProfileEdit] = useState(mode === "register");
  const editSectionRef = useRef<HTMLDivElement>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() => getInitialProfile(user));
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

  useEffect(() => {
    const initialProfile = getInitialProfile(user);
    setProfileForm(initialProfile);
    const mustComplete = !initialProfile.name || !initialProfile.school || !initialProfile.grade || !initialProfile.region || !initialProfile.majorPreference || !initialProfile.interests || !initialProfile.desiredMajors || !initialProfile.careerGoals || !initialProfile.preferredCountries || !initialProfile.acceptFarFromHome || !initialProfile.budgetPerYear;
    setForceProfileEdit(mode === "register" ? true : mustComplete);
    if (mode === "register" || mustComplete) {
      setShowEditSection(true);
    }
  }, [user, mode]);

  // 打开编辑对话框
  const handleOpenEdit = () => {
    setShowEditSection(true);
    requestAnimationFrame(() => {
      editSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const isSaveDisabled =
    saving ||
    !profileForm.name ||
    !profileForm.school ||
    !profileForm.grade ||
    !profileForm.region ||
    !profileForm.majorPreference ||
    !profileForm.interests ||
    !profileForm.desiredMajors ||
    !profileForm.careerGoals ||
    !profileForm.preferredCountries ||
    !profileForm.acceptFarFromHome ||
    !profileForm.budgetPerYear;

  // 保存个人资料
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const profile = {
        name: profileForm.name,
        school: profileForm.school,
        grade: profileForm.grade,
        region: profileForm.region,
        majorPreference: profileForm.majorPreference,
        interests: profileForm.interests,
        desiredMajors: profileForm.desiredMajors,
        careerGoals: profileForm.careerGoals,
        preferredRegion: profileForm.preferredRegion,
        preferredCountries: profileForm.preferredCountries,
        acceptFarFromHome: profileForm.acceptFarFromHome,
        budgetPerYear: profileForm.budgetPerYear,
        needScholarship: profileForm.needScholarship,
        extracurriculars: profileForm.extracurriculars,
        awards: profileForm.awards,
        internships: profileForm.internships,
        universityType: profileForm.universityType,
        campusEnvironment: profileForm.campusEnvironment,
        rankingPreference: profileForm.rankingPreference,
        completedAt: new Date().toISOString(),
      };

      const supabase = getSupabaseClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            profile,
          },
        });
        if (error) {
          throw error;
        }
        if (data.user) {
          onProfileUpdated(data.user);
        }
      }

      setShowEditSection(false);
    } catch (error) {
      console.error('保存个人资料失败:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };
  const userName = profileForm.name ||
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    (user?.user_metadata?.given_name && user?.user_metadata?.family_name 
      ? `${user.user_metadata.given_name} ${user.user_metadata.family_name}` 
      : null) ||
    user?.user_metadata?.given_name ||
    user?.email?.split('@')[0] || 
    '用戶';
  
  const userEmail = user?.email || 'student@email.com';
  const isProfileComplete = Boolean(
    profileForm.name &&
    profileForm.school &&
    profileForm.grade &&
    profileForm.region &&
    profileForm.majorPreference &&
    profileForm.interests &&
    profileForm.desiredMajors &&
    profileForm.careerGoals &&
    profileForm.preferredCountries &&
    profileForm.acceptFarFromHome &&
    profileForm.budgetPerYear
  );

  useEffect(() => {
    if (forceProfileEdit) {
      setShowEditSection(true);
    }
  }, [forceProfileEdit]);
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const menuSections = [
    {
      title: "個人資料",
      items: [
        { icon: User, label: "編輯個人資料", value: userName, color: "text-blue-600" },
        { icon: GraduationCap, label: "學歷資訊", value: profileForm.school || "尚未填寫", color: "text-purple-600" },
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
          <h1 className="text-[32px] text-gray-900 mb-2">{mode === "register" ? "註冊資料" : "個人資料"}</h1>
          <p className="text-[16px] text-gray-600">{mode === "register" ? "完成註冊後才可使用全部功能" : "管理您的帳號與偏好設定"}</p>
        </div>

        {mode !== "register" && (
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
                {!isProfileComplete && (
                  <p className="text-[13px] text-yellow-200 mt-2">
                    請完成註冊資料，否則無法使用其他功能
                  </p>
                )}
              </div>
              <button 
                onClick={handleOpenEdit}
                className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              >
                編輯個人資料
              </button>
            </div>
          </div>
        )}

        {mode !== "register" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat, index) => (
              <div key={index} className={`bg-gradient-to-br ${stat.color} rounded-3xl p-6 text-white shadow-lg`}>
                <p className="text-[14px] text-white/80 mb-2">{stat.label}</p>
                <p className="text-[42px]">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {mode !== "register" && (
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
                            {item.label === "學歷資訊" && (
                              <p className="text-[12px] text-gray-400">
                                {profileForm.school && profileForm.grade && profileForm.region && profileForm.majorPreference ? "已完成" : "未完成"}
                              </p>
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
        )}

        {mode !== "register" && (
          <p className="text-center text-[14px] text-gray-400 mt-8">
            © 2026 AI 升學輔助 All Rights Reserved
          </p>
        )}
      </div>

      {showEditSection && (
        <div ref={editSectionRef} className="mt-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] text-gray-900 mb-2">註冊資料填寫</h2>
              <p className="text-[14px] text-gray-600">
                請完整填寫個人資訊（成績＋興趣＋地區＋預算＋背景），完成後才可使用系統
              </p>
            </div>
            {!forceProfileEdit && (
              <button
                onClick={() => setShowEditSection(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 text-[12px] text-gray-500">
            帶 * 為必填，其餘為選填
          </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">姓名 *</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="請輸入姓名"
                className="text-base"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="school" className="text-base font-medium">學校 *</Label>
              <Input
                id="school"
                value={profileForm.school}
                onChange={(e) => setProfileForm({ ...profileForm, school: e.target.value })}
                placeholder="請輸入目前就讀學校"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade" className="text-base font-medium">年級 *</Label>
              <Input
                id="grade"
                value={profileForm.grade}
                onChange={(e) => setProfileForm({ ...profileForm, grade: e.target.value })}
                placeholder="例如：高三、大一等"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-base font-medium">地區偏好 *</Label>
              <Input
                id="region"
                value={profileForm.region}
                onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                placeholder="例如：台北市、新北市、澳門等"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="majorPreference" className="text-base font-medium">科系偏好 *</Label>
              <Input
                id="majorPreference"
                value={profileForm.majorPreference}
                onChange={(e) => setProfileForm({ ...profileForm, majorPreference: e.target.value })}
                placeholder="例如：資訊工程、醫學、商管等"
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="interests" className="text-base font-medium">興趣與想讀的科目 *</Label>
              <Input
                id="interests"
                value={profileForm.interests}
                onChange={(e) => setProfileForm({ ...profileForm, interests: e.target.value })}
                placeholder="例如：數學、電腦、心理學"
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="desiredMajors" className="text-base font-medium">想讀的專業 / Major *</Label>
              <Input
                id="desiredMajors"
                value={profileForm.desiredMajors}
                onChange={(e) => setProfileForm({ ...profileForm, desiredMajors: e.target.value })}
                placeholder="例如：Computer Science、Business Administration"
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="careerGoals" className="text-base font-medium">未來想從事的職業方向 *</Label>
              <Input
                id="careerGoals"
                value={profileForm.careerGoals}
                onChange={(e) => setProfileForm({ ...profileForm, careerGoals: e.target.value })}
                placeholder="例如：軟體工程師、金融分析師"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredRegion" className="text-base font-medium">地區偏好</Label>
              <Input
                id="preferredRegion"
                value={profileForm.preferredRegion}
                onChange={(e) => setProfileForm({ ...profileForm, preferredRegion: e.target.value })}
                placeholder="例如：北部、南部、海外"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredCountries" className="text-base font-medium">想去哪個國家或城市讀書 *</Label>
              <Input
                id="preferredCountries"
                value={profileForm.preferredCountries}
                onChange={(e) => setProfileForm({ ...profileForm, preferredCountries: e.target.value })}
                placeholder="例如：United States、United Kingdom"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acceptFarFromHome" className="text-base font-medium">是否接受離家遠或出國 *</Label>
              <Input
                id="acceptFarFromHome"
                value={profileForm.acceptFarFromHome}
                onChange={(e) => setProfileForm({ ...profileForm, acceptFarFromHome: e.target.value })}
                placeholder="例如：可以、需要考慮、不接受"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetPerYear" className="text-base font-medium">每年可以負擔的學費 *</Label>
              <Input
                id="budgetPerYear"
                value={profileForm.budgetPerYear}
                onChange={(e) => setProfileForm({ ...profileForm, budgetPerYear: e.target.value })}
                placeholder="例如：20 萬台幣 / 6 萬美金"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="needScholarship" className="text-base font-medium">是否需要獎學金或助學金</Label>
              <Input
                id="needScholarship"
                value={profileForm.needScholarship}
                onChange={(e) => setProfileForm({ ...profileForm, needScholarship: e.target.value })}
                placeholder="例如：需要 / 不需要"
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="extracurriculars" className="text-base font-medium">課外活動（社團、比賽、義工）</Label>
              <Input
                id="extracurriculars"
                value={profileForm.extracurriculars}
                onChange={(e) => setProfileForm({ ...profileForm, extracurriculars: e.target.value })}
                placeholder="請簡述課外活動"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="awards" className="text-base font-medium">獎項或證書</Label>
              <Input
                id="awards"
                value={profileForm.awards}
                onChange={(e) => setProfileForm({ ...profileForm, awards: e.target.value })}
                placeholder="例如：競賽得獎、證照"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internships" className="text-base font-medium">實習或專案經驗</Label>
              <Input
                id="internships"
                value={profileForm.internships}
                onChange={(e) => setProfileForm({ ...profileForm, internships: e.target.value })}
                placeholder="例如：企業實習、專案"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="universityType" className="text-base font-medium">大學類型偏好</Label>
              <Input
                id="universityType"
                value={profileForm.universityType}
                onChange={(e) => setProfileForm({ ...profileForm, universityType: e.target.value })}
                placeholder="例如：研究型大學 / 文理學院"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campusEnvironment" className="text-base font-medium">校園環境偏好</Label>
              <Input
                id="campusEnvironment"
                value={profileForm.campusEnvironment}
                onChange={(e) => setProfileForm({ ...profileForm, campusEnvironment: e.target.value })}
                placeholder="例如：城市 / 郊區"
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="rankingPreference" className="text-base font-medium">排名要求</Label>
              <Input
                id="rankingPreference"
                value={profileForm.rankingPreference}
                onChange={(e) => setProfileForm({ ...profileForm, rankingPreference: e.target.value })}
                placeholder="例如：世界前100 / 前50"
                className="text-base"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            {!forceProfileEdit && (
              <Button
                variant="outline"
                onClick={() => setShowEditSection(false)}
                disabled={saving}
              >
                取消
              </Button>
            )}
            <Button
              onClick={handleSaveProfile}
              disabled={isSaveDisabled}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}