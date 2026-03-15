import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, CheckCircle, Sparkles, MessageSquare, X, ArrowLeft, Download, Printer } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { Button } from "./ui/button";

interface InterviewEvaluationPageProps {
  onNavigate: (page: string) => void;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sample_answer?: string;
  details?: Record<string, number>;
  qaPairs?: Array<{ question: string; answer: string; summary: string; audioUrl?: string }>;
}

const EVALUATION_STORAGE_KEY = "interview_evaluation_view";

export function InterviewEvaluationPage({ onNavigate }: InterviewEvaluationPageProps) {
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!stored) {
      setEvaluationResult(null);
      return;
    }

    try {
      setEvaluationResult(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to parse interview evaluation view:", error);
      setEvaluationResult(null);
    }
  }, []);

  const detailsEntries = useMemo(() => {
    if (!evaluationResult?.details) return [];
    return Object.entries(evaluationResult.details);
  }, [evaluationResult]);

  const qaPairs = evaluationResult?.qaPairs || [];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!evaluationResult) return;
    setIsExporting(true);

    try {
      const response = await fetch("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js");
      if (!response.ok) {
        throw new Error("無法載入匯出模組");
      }

      const scriptText = await response.text();
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.text = scriptText;
      document.body.appendChild(script);

      const htmlToImage = (window as any).htmlToImage;
      if (!htmlToImage?.toPng) {
        throw new Error("匯出模組載入失敗");
      }

      const target = document.getElementById("evaluation-report");
      if (!target) {
        throw new Error("找不到報告區塊");
      }

      const dataUrl = await htmlToImage.toPng(target, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `面試評分報告-${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (error) {
      console.error("匯出報告失敗:", error);
      alert(error instanceof Error ? error.message : "匯出報告失敗，請稍後再試");
    } finally {
      setIsExporting(false);
    }
  };

  if (!evaluationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <p className="text-[16px] text-gray-600 mb-6">尚未找到評分結果，請先完成面試評分。</p>
            <Button
              onClick={() => onNavigate("interview-practice")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              返回面試練習
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            onClick={() => onNavigate("interview-practice")}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] md:text-[15px]">返回面試練習</span>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={isExporting}
              className="h-9 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {isExporting ? "匯出中..." : "下載報告"}
              <Download className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={handlePrint}
              className="h-9 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              列印
              <Printer className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div id="evaluation-report" className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-[24px] font-bold text-white">面試評分結果</h2>
                  <p className="text-[14px] text-white/80">DeepSeek AI 專業評估</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("interview-practice")}
                className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                title="返回面試練習"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center border-b border-gray-200 pb-6">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 mb-4">
                <span className="text-[42px] font-bold text-purple-600">{evaluationResult.score}</span>
                <span className="text-[20px] text-purple-600 ml-1">分</span>
              </div>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    evaluationResult.score >= 80
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : evaluationResult.score >= 60
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      : evaluationResult.score >= 40
                      ? "bg-gradient-to-r from-orange-500 to-orange-600"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}
                  style={{ width: `${Math.min(evaluationResult.score, 100)}%` }}
                />
              </div>
              <p
                className={`text-[15px] font-semibold ${
                  evaluationResult.score >= 80
                    ? "text-green-600"
                    : evaluationResult.score >= 60
                    ? "text-yellow-600"
                    : evaluationResult.score >= 40
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {evaluationResult.score >= 80
                  ? "優秀"
                  : evaluationResult.score >= 60
                  ? "良好"
                  : evaluationResult.score >= 40
                  ? "一般"
                  : "需要大幅改進"}
              </p>
            </div>

            {detailsEntries.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {detailsEntries.map(([key, value]) => {
                  const score = Number(value) || 0;
                  const maxScore = 25;
                  const percentage = (score / maxScore) * 100;
                  return (
                    <div
                      key={key}
                      className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-purple-300 transition-colors"
                    >
                      <p className="text-[13px] text-gray-600 mb-3 font-medium">
                        {key === "expression"
                          ? "表達能力"
                          : key === "professional"
                          ? "專業素養"
                          : key === "communication"
                          ? "溝通能力"
                          : key === "comprehensive"
                          ? "綜合素質"
                          : key}
                      </p>
                      <div className="mb-2">
                        <p
                          className={`text-[28px] font-bold ${
                            score === 0
                              ? "text-red-600"
                              : score < 10
                              ? "text-orange-600"
                              : score < 15
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {score}
                        </p>
                        <p className="text-[11px] text-gray-400">/ {maxScore}</p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            score === 0
                              ? "bg-red-500"
                              : score < 10
                              ? "bg-orange-500"
                              : score < 15
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailsEntries.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-4">能力雷達圖</h3>
                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={detailsEntries.map(([key, value]) => ({
                        subject:
                          key === "expression"
                            ? "表達"
                            : key === "professional"
                            ? "專業"
                            : key === "communication"
                            ? "溝通"
                            : key === "comprehensive"
                            ? "綜合"
                            : key,
                        score: Math.min(Number(value) || 0, 25),
                        fullMark: 25,
                      }))}
                      outerRadius="70%"
                    >
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 25]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <Radar name="score" dataKey="score" stroke="#7c3aed" fill="#a855f7" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5">
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">總體評價</h3>
              <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                {evaluationResult.feedback}
              </p>
            </div>

            {evaluationResult.strengths?.length > 0 && (
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  優勢表現
                </h3>
                <ul className="space-y-2">
                  {evaluationResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-[15px] text-gray-700">
                      <span className="text-green-600 mt-1 font-bold">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evaluationResult.improvements?.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  改進建議
                </h3>
                <ul className="space-y-2.5">
                  {evaluationResult.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-[15px] text-gray-700">
                      <span className="text-orange-600 mt-1 font-bold">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {evaluationResult.sample_answer && evaluationResult.sample_answer.trim().length > 0 && (
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  示範回答
                </h3>
                <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {evaluationResult.sample_answer}
                </p>
              </div>
            )}

            {qaPairs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-3">問題與回答對照</h3>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                  {qaPairs.map((pair, index) => (
                    <div key={`${index}-${pair.answer.slice(0, 6)}`} className="border border-gray-100 rounded-lg p-3">
                      <p className="text-[12px] text-purple-600 font-semibold mb-1">Q{index + 1}</p>
                      <p className="text-[14px] text-gray-800 mb-2 whitespace-pre-wrap">{pair.question}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[12px] text-blue-600 font-semibold">A{index + 1}</p>
                        {pair.audioUrl && (
                          <audio controls className="h-8 w-full">
                            <source src={pair.audioUrl} type="audio/webm" />
                          </audio>
                        )}
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-2">
                        <p className="text-[12px] text-blue-700 font-semibold mb-1">重點摘要</p>
                        <p className="text-[13px] text-blue-700 whitespace-pre-wrap">{pair.summary || "（無摘要）"}</p>
                      </div>
                      <p className="text-[14px] text-gray-700 whitespace-pre-wrap">{pair.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => onNavigate("interview-practice")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                返回面試
              </Button>
              <Button
                onClick={() => onNavigate("grades-and-practice")}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                回到總覽
              </Button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          #root {
            background: #ffffff !important;
          }

          button {
            display: none !important;
          }

          .shadow-2xl,
          .shadow-xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
