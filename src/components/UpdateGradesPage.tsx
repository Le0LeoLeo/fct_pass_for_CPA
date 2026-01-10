import { Save, Plus, Trash2, TrendingUp, Calendar, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState, useRef } from "react";
import { performOCR } from "../services/api";

interface UpdateGradesPageProps {
  onNavigate: (page: string) => void;
}

interface Subject {
  id: string;
  name: string;
  score: string;
  credit: string;
}

export function UpdateGradesPage({ onNavigate }: UpdateGradesPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "1", name: "國文", score: "85", credit: "4" },
    { id: "2", name: "英文", score: "88", credit: "4" },
    { id: "3", name: "數學", score: "82", credit: "4" },
    { id: "4", name: "物理", score: "90", credit: "3" },
    { id: "5", name: "化學", score: "87", credit: "3" },
  ]);

  const [semester, setSemester] = useState("高三上學期");
  const [isUploading, setIsUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setOcrResult("");

    try {
      const result = await performOCR(file);
      const ocrText = result.ocr?.choices?.[0]?.message?.content || "";
      setOcrResult(ocrText);
      
      // 尝试解析成绩数据
      parseGradesFromOCR(ocrText);
    } catch (error) {
      console.error("OCR failed:", error);
      setOcrResult("OCR识别失败，请重试或手动输入");
    } finally {
      setIsUploading(false);
    }
  };

  const parseGradesFromOCR = (text: string) => {
    // 简单的成绩解析逻辑
    const lines = text.split('\n');
    const newSubjects: Subject[] = [];
    
    lines.forEach((line) => {
      // 尝试匹配 "科目名 分数" 或 "科目名: 分数" 等格式
      const match = line.match(/([\u4e00-\u9fff]+)[\s:：]*(\d+(?:\.\d+)?)/);
      if (match) {
        const subjectName = match[1].trim();
        const score = match[2].trim();
        
        // 检查是否已存在该科目
        if (!subjects.some(s => s.name === subjectName)) {
          newSubjects.push({
            id: Date.now().toString() + Math.random(),
            name: subjectName,
            score: score,
            credit: "4", // 默认学分
          });
        }
      }
    });

    if (newSubjects.length > 0) {
      setSubjects([...subjects, ...newSubjects]);
    }
  };

  const addSubject = () => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: "",
      score: "",
      credit: "",
    };
    setSubjects([...subjects, newSubject]);
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    setSubjects(subjects.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(sub => sub.id !== id));
  };

  const calculateAverage = () => {
    if (subjects.length === 0) return "0.0";
    const validScores = subjects.filter(s => s.score && !isNaN(parseFloat(s.score)));
    if (validScores.length === 0) return "0.0";
    
    const totalCredits = validScores.reduce((sum, s) => sum + (parseFloat(s.credit) || 0), 0);
    const weightedSum = validScores.reduce((sum, s) => 
      sum + (parseFloat(s.score) * (parseFloat(s.credit) || 0)), 0
    );
    
    return totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : "0.0";
  };

  const semesters = [
    "高一上學期", "高一下學期",
    "高二上學期", "高二下學期",
    "高三上學期", "高三下學期"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 md:mb-8"
        >
          <h1 className="text-[20px] md:text-[32px] text-gray-900 mb-1 md:mb-2">更新成績</h1>
          <p className="text-[13px] md:text-[16px] text-gray-600">輸入與管理您的學期成績資料</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* OCR Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-3 md:p-6 mb-3 md:mb-6"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                <h3 className="text-[16px] md:text-[20px] text-gray-900">OCR 識別成績單</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[14px]">識別中...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="text-[14px]">上傳成績單圖片</span>
                    </>
                  )}
                </motion.button>
                {ocrResult && (
                  <div className="flex-1 p-3 bg-gray-50 rounded-xl text-[13px] text-gray-600 max-h-32 overflow-y-auto">
                    {ocrResult}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Semester Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-3 md:p-6 mb-3 md:mb-6"
            >
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <Calendar className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                <h3 className="text-[16px] md:text-[20px] text-gray-900">選擇學期</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {semesters.map((sem, index) => (
                  <motion.button
                    key={sem}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSemester(sem)}
                    className={`px-4 py-3 rounded-xl transition-all ${
                      semester === sem
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {sem}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Grades Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-gray-100 p-3 md:p-6"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-[16px] md:text-[20px] text-gray-900">科目成績</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addSubject}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg md:rounded-xl hover:bg-blue-700 transition-colors text-[13px] md:text-[15px]"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">新增科目</span>
                  <span className="sm:hidden">新增</span>
                </motion.button>
              </div>

              <div className="space-y-2 md:space-y-3">
                {/* Table Header - Hidden on mobile */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="col-span-5 text-[14px] text-gray-600">科目名稱</div>
                  <div className="col-span-3 text-[14px] text-gray-600">分數</div>
                  <div className="col-span-3 text-[14px] text-gray-600">學分</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Table Rows */}
                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="grid grid-cols-12 gap-2 md:gap-3 items-center"
                  >
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={subject.name}
                        onChange={(e) => updateSubject(subject.id, "name", e.target.value)}
                        placeholder="科目"
                        className="w-full px-2 py-2 md:px-4 md:py-3 text-[13px] md:text-[15px] bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={subject.score}
                        onChange={(e) => updateSubject(subject.id, "score", e.target.value)}
                        placeholder="分數"
                        min="0"
                        max="100"
                        className="w-full px-2 py-2 md:px-4 md:py-3 text-[13px] md:text-[15px] bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={subject.credit}
                        onChange={(e) => updateSubject(subject.id, "credit", e.target.value)}
                        placeholder="學分"
                        min="0"
                        max="10"
                        className="w-full px-2 py-2 md:px-4 md:py-3 text-[13px] md:text-[15px] bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteSubject(subject.id)}
                        className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Save Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 md:mt-6 flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg md:rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[14px] md:text-[16px]">儲存成績</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Right Sidebar - Statistics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Average Score */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[20px]">學期平均</h3>
              </div>
              <div className="mb-2">
                <p className="text-[14px] text-blue-100">加權平均分數</p>
              </div>
              <motion.p 
                key={calculateAverage()}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[56px]"
              >
                {calculateAverage()}
              </motion.p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[14px] text-blue-100">科目數</span>
                  <span className="text-[18px]">{subjects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-blue-100">總學分</span>
                  <span className="text-[18px]">
                    {subjects.reduce((sum, s) => sum + (parseFloat(s.credit) || 0), 0)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-[18px] text-gray-900 mb-4">提示</h3>
              <ul className="space-y-3">
                {[
                  "定期更新成績以追蹤學習表現",
                  "系統會自動計算加權平均",
                  "可依學期分別管理成績記錄",
                  "成績資料將用於分析與推薦"
                ].map((tip, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-2 text-[14px] text-gray-600"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-lg p-6 text-white"
            >
              <h3 className="text-[18px] mb-3">快速操作</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate("statistics")}
                  className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl py-3 transition-all border border-white/30"
                >
                  <span className="text-[15px]">查看成績統計</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate("grades-and-practice")}
                  className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl py-3 transition-all border border-white/30"
                >
                  <span className="text-[15px]">返回成績與練習</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}