import { User, Settings, Bell, GraduationCap, LogOut, ChevronRight } from "lucide-react";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function ProfilePage({ onNavigate, onLogout }: ProfilePageProps) {
  const menuSections = [
    {
      title: "個人資料",
      items: [
        { icon: User, label: "編輯個人資料", value: "", color: "text-blue-600" },
        { icon: GraduationCap, label: "學歷資訊", value: "高中三年級", color: "text-purple-600" },
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

  const stats = [
    { label: "使用天數", value: "28", color: "from-blue-500 to-blue-600" },
    { label: "完成問卷", value: "3", color: "from-purple-500 to-purple-600" },
    { label: "面試練習", value: "12", color: "from-green-500 to-green-600" },
    { label: "收藏學校", value: "8", color: "from-orange-500 to-orange-600" },
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
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-[28px] text-white mb-2">陳同學</h2>
              <p className="text-[16px] text-blue-100 mb-4">student@email.com</p>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[14px] text-white border border-white/30">
                  高中三年級
                </span>
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[14px] text-white border border-white/30">
                  會員編號: A123456
                </span>
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              編輯個人資料
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
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
    </div>
  );
}