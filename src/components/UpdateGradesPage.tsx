import { Save, Upload, Loader2, Image as ImageIcon, FileText, X, TrendingUp, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { performOCR, parseGradesFromOCR, GradeEvent } from "../services/api";

// PDF.js types
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface UpdateGradesPageProps {
  onNavigate: (page: string) => void;
}

interface GradeEventWithScore extends GradeEvent {
  score: string;
  maxScore: string;
  note: string;
}

const LS_KEY = "schedule_score_state_v1";

export function UpdateGradesPage({ onNavigate }: UpdateGradesPageProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [ocrResult, setOcrResult] = useState<string>("");
  const [gradeEvents, setGradeEvents] = useState<GradeEventWithScore[]>([]);

  // 记录成绩查看时间
  useEffect(() => {
    localStorage.setItem('last_grade_view', new Date().toISOString());
  }, []);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageMeta, setImageMeta] = useState<string>("");
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(2);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [track, setTrack] = useState<'liberal' | 'science' | undefined>(undefined);
  const [showInfo, setShowInfo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfjsLibRef = useRef<any>(null);

  // Load from localStorage on mount
  useEffect(() => {
    loadLocal();
  }, []);

  // Auto-save when gradeEvents change (silent save)
  useEffect(() => {
    if (gradeEvents.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        // Save to localStorage silently
        try {
          const scores: Record<string, { score: string; maxScore: string; note: string }> = {};
          gradeEvents.forEach(ev => {
            scores[ev.id] = {
              score: ev.score,
              maxScore: ev.maxScore,
              note: ev.note,
            };
          });
          const state = {
            ocrContent: ocrResult,
            events: gradeEvents.map(({ score, maxScore, note, ...ev }) => ev),
            scores,
            previewImage,
            track,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(LS_KEY, JSON.stringify(state));
        } catch (e) {
          console.error('Auto-save failed:', e);
        }
      }, 2000); // 2秒后自动保存

      return () => clearTimeout(autoSaveTimer);
    }
  }, [gradeEvents, ocrResult, previewImage, track]);

  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (obj.events && Array.isArray(obj.events)) {
        const eventsWithScores: GradeEventWithScore[] = obj.events.map((ev: GradeEvent) => ({
          ...ev,
          score: obj.scores?.[ev.id]?.score || '',
          maxScore: obj.scores?.[ev.id]?.maxScore || '100',
          note: obj.scores?.[ev.id]?.note || '',
        }));
        setGradeEvents(eventsWithScores);
        if (obj.previewImage) setPreviewImage(obj.previewImage);
        if (obj.ocrResult) setOcrResult(obj.ocrResult);
        return true;
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return false;
  };

  const saveLocal = (showMessage: boolean = true) => {
    try {
      const scores: Record<string, { score: string; maxScore: string; note: string }> = {};
      gradeEvents.forEach(ev => {
        scores[ev.id] = {
          score: ev.score,
          maxScore: ev.maxScore,
          note: ev.note,
        };
      });
      const state = {
        ocrContent: ocrResult,
        events: gradeEvents.map(({ score, maxScore, note, ...ev }) => ev),
        scores,
        previewImage,
        track,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      if (showMessage) {
        setStatus("已保存到本機");
        setTimeout(() => setStatus(""), 2000);
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const clearAll = () => {
    setGradeEvents([]);
    setOcrResult("");
    setPreviewImage("");
    setImageMeta("");
    setError("");
    setStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const ensurePdfJs = async () => {
    if (pdfjsLibRef.current) return pdfjsLibRef.current;

    try {
      // Dynamically import pdf.js module build
      const mod = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
      pdfjsLibRef.current = mod;
      pdfjsLibRef.current.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      return pdfjsLibRef.current;
    } catch (error) {
      console.error('Failed to load PDF.js:', error);
      throw new Error('無法載入 PDF.js 庫');
    }
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const pdfPageToPngDataURL = async (
    file: File,
    pageNumber: number = 1,
    scale: number = 2
  ): Promise<{ dataUrl: string; numPages: number; width: number; height: number }> => {
    const lib = await ensurePdfJs();
    const ab = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: ab }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`PDF 只有 ${pdf.numPages} 頁，你選的是第 ${pageNumber} 頁`);
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('無法創建 canvas context');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    return {
      dataUrl,
      numPages: pdf.numPages,
      width: canvas.width,
      height: canvas.height,
    };
  };

  const preprocessOCRText = (text: string): string => {
    const KEYWORDS = [
      "大測", "測驗", "考試", "報告", "作業", "選考", "實驗", "實驗考", "期中", "期末"
    ];

    const lines = String(text)
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    const filtered = lines.filter(line => {
      const hasDate = /\b\d{1,2}\/\d{1,2}\b/.test(line);
      const hasKeyword = KEYWORDS.some(k => line.includes(k));
      const hasWeek = line.includes("第") && line.includes("週");
      return (hasDate && hasKeyword) || hasWeek;
    });

    const compactText = (filtered.length > 0 ? filtered : lines)
      .join("\n")
      .replace(/\s+/g, " ")
      .trim();

    const MAX_PARSE_CHARS = 6000;
    return compactText.length > MAX_PARSE_CHARS
      ? (compactText.slice(0, MAX_PARSE_CHARS) + "\n\n(內容過長已截斷)")
      : compactText;
  };

  const updateEventScore = (id: string, field: 'score' | 'maxScore' | 'note', value: string) => {
    setGradeEvents(events =>
      events.map(ev => ev.id === id ? { ...ev, [field]: value } : ev)
    );
  };

  const analyze = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("請先選擇 PDF 或 PNG/JPG 檔案。");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setStatus("");

    try {
      let imageDataUrl: string;
      let metaInfo: string;

      // Handle PDF files
      if (file.type === "application/pdf") {
        setStatus("載入 PDF 引擎...");
        await ensurePdfJs();

        setStatus(`渲染 PDF 第 ${pdfPage} 頁...`);
        const pdfResult = await pdfPageToPngDataURL(file, pdfPage, pdfScale);
        imageDataUrl = pdfResult.dataUrl;
        setPdfNumPages(pdfResult.numPages);
        metaInfo = `PDF: ${file.name}（第 ${pdfPage}/${pdfResult.numPages} 頁，渲染尺寸 ${pdfResult.width}x${pdfResult.height}）`;
      } else {
        // Handle image files
        imageDataUrl = await fileToDataURL(file);
        metaInfo = `圖片: ${file.name} (${file.type}，${Math.round(file.size / 1024)} KB)`;
      }

      setPreviewImage(imageDataUrl);
      setImageMeta(metaInfo);

      // Step 1: OCR (use the rendered image for PDFs)
      setStatus("OCR 識別中...");
      // For PDFs, we need to create a File object from the rendered image
      let fileToOcr: File = file;
      if (file.type === "application/pdf") {
        // Convert data URL to blob, then to File
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        fileToOcr = new File([blob], `${file.name}_page${pdfPage}.png`, { type: 'image/png' });
      }
      const ocrResult = await performOCR(fileToOcr);
      const ocrText = ocrResult.ocr?.choices?.[0]?.message?.content || "";
      setOcrResult(ocrText);

      if (!ocrText) {
        throw new Error("OCR 未返回任何內容");
      }

      // Step 2: Parse with DeepSeek
      setStatus("DeepSeek 整理中...");
      const processedText = preprocessOCRText(ocrText);
      const parseResult = await parseGradesFromOCR(processedText, track);

      // Extract events
      let events: GradeEvent[] = [];
      if (parseResult.events && parseResult.events.length > 0) {
        events = parseResult.events;
      } else if (parseResult.choices && parseResult.choices.length > 0) {
        const content = parseResult.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*"events"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            events = Array.isArray(parsed.events) ? parsed.events : [];
          } catch (e) {
            try {
              const parsed = JSON.parse(content);
              events = Array.isArray(parsed.events) ? parsed.events : [];
            } catch (e2) {
              console.error('Failed to parse events:', e2);
            }
          }
        }
      }

      // Convert to events with scores
      const eventsWithScores: GradeEventWithScore[] = events.map(ev => ({
        ...ev,
        score: '',
        maxScore: '100',
        note: '',
      }));

      setGradeEvents(eventsWithScores);
      setStatus("分析完成。");
    } catch (e) {
      console.error("Analyze error:", e);
      setError(String(e));
      setStatus("處理失敗，請檢查錯誤訊息。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateStats = () => {
    const bySubject = new Map<string, { count: number; scored: number; sum: number; totalScore: number; totalMax: number }>();
    let totalScored = 0;
    let totalEvents = 0;
    let totalScoreSum = 0;
    let totalMaxSum = 0;
    
    // Helper function to check if subject is elective (選修)
    const isElective = (subject: string): boolean => {
      return subject.includes("選") || subject.includes("選修");
    };
    
    for (const ev of gradeEvents) {
      const subj = ev.subject || '(未分類)';
      const isElectiveSubject = isElective(subj);
      
      if (!bySubject.has(subj)) {
        bySubject.set(subj, { count: 0, scored: 0, sum: 0, totalScore: 0, totalMax: 0 });
      }
      const agg = bySubject.get(subj)!;
      agg.count += 1;
      totalEvents += 1;
      
      const sc = Number(ev.score);
      const max = Number(ev.maxScore || 100);
      if (!Number.isNaN(sc) && ev.score !== '') {
        agg.scored += 1;
        const pct = max > 0 ? (sc / max) * 100 : 0;
        agg.sum += pct;
        agg.totalScore += sc;
        agg.totalMax += max;
        
        // 選修不記入平均分
        if (!isElectiveSubject) {
          totalScored += 1;
          totalScoreSum += sc;
          totalMaxSum += max;
        }
      }
    }

    const overallAvg = totalScored > 0 && totalMaxSum > 0 
      ? ((totalScoreSum / totalMaxSum) * 100).toFixed(1)
      : '-';

    return {
      bySubject: Array.from(bySubject.entries()).map(([subj, a]) => ({
        subject: subj,
        avg: a.scored > 0 ? (a.sum / a.scored).toFixed(1) : '-',
        avgScore: a.scored > 0 ? (a.totalScore / a.scored).toFixed(1) : '-',
        scored: a.scored,
        total: a.count,
        completion: a.count > 0 ? ((a.scored / a.count) * 100).toFixed(0) : '0'
      })),
      overall: {
        totalEvents,
        totalScored,
        completion: totalEvents > 0 ? ((totalScored / totalEvents) * 100).toFixed(0) : '0',
        overallAvg,
        overallScore: totalScored > 0 ? (totalScoreSum / totalScored).toFixed(1) : '-',
        overallMax: totalScored > 0 ? (totalMaxSum / totalScored).toFixed(1) : '-',
      }
    };
  };

  const stats = calculateStats();
  const summaryText = stats.bySubject.length > 0
    ? stats.bySubject.map(s => `${s.subject}：已填 ${s.scored}/${s.total}，平均%=${s.avg}`).join('\n')
    : '';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl text-gray-900">課表掃描 → DeepSeek 整理 → 分數統計</h1>
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
                <p><strong>📸 OCR識別成績單：</strong>上傳成績單圖片（JPG/PNG）或PDF文件，系統會自動識別並提取成績資料。支援PDF多頁，可選擇要識別的頁碼。</p>
                <p><strong>✍️ 手動輸入成績：</strong>支援手動輸入各科目成績，包含分數、滿分、備註等資訊。可隨時修改已輸入的成績。</p>
                <p><strong>📅 學期管理：</strong>按學期組織成績，支援多學期成績記錄。系統會自動識別學期資訊。</p>
                <p><strong>📊 加權平均計算：</strong>自動計算各科目加權平均分數。選修科目不計入平均分計算。</p>
                <p><strong>💾 自動保存：</strong>成績資料會自動保存到本地存儲，防止資料遺失。修改後2秒自動保存。</p>
                <p><strong>🎯 文理組選擇：</strong>選擇文組或理組，用於後續分析和推薦。</p>
                <p className="mt-3 text-xs text-blue-600"><strong>💡 提示：</strong>確保成績單圖片清晰，文字可讀。OCR識別結果可能需要手動調整。</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6"
        >
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">選擇檔案：</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => {
                  // Reset PDF page when file changes
                  if (e.target.files?.[0]?.type !== "application/pdf") {
                    setPdfNumPages(0);
                    setPdfPage(1);
                  }
                }}
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">PDF 頁碼：</span>
              <input
                type="number"
                min="1"
                max={pdfNumPages || 1}
                value={pdfPage}
                onChange={(e) => {
                  const page = Number(e.target.value);
                  if (page >= 1 && (!pdfNumPages || page <= pdfNumPages)) {
                    setPdfPage(page);
                  }
                }}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg"
                disabled={!pdfNumPages}
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">PDF scale：</span>
              <input
                type="number"
                min="1"
                step="0.25"
                value={pdfScale}
                onChange={(e) => setPdfScale(Number(e.target.value))}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-lg"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">文理科：</span>
              <select
                value={track || ''}
                onChange={(e) => setTrack(e.target.value as 'liberal' | 'science' | '' || undefined)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="">請選擇</option>
                <option value="liberal">文科</option>
                <option value="science">理科</option>
              </select>
            </label>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={analyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>處理中...</span>
                </>
              ) : (
                <span>一鍵分析（OCR + DeepSeek）</span>
              )}
            </motion.button>

            {status && (
              <span className="text-sm text-blue-600">{status}</span>
            )}
            {gradeEvents.length > 0 && !status && (
              <span className="text-xs text-gray-400">
                （分數變更後 2 秒自動保存）
              </span>
            )}

            <div className="flex gap-2 ml-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={saveLocal}
                disabled={gradeEvents.length === 0}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                存到本機
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadLocal}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                讀取本機
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  localStorage.removeItem(LS_KEY);
                  clearAll();
                }}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                清除
              </motion.button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            流程：選檔 → 選擇文理科 → 點「一鍵分析」→ OCR → DeepSeek 解析成事件 → 產生成績填寫表與統計。
          </p>
          {track && (
            <p className="text-xs text-blue-600 mt-1">
              {track === 'liberal' 
                ? '已選擇文科：將忽略報告、考試、化選、物選、生選'
                : '已選擇理科：將忽略報告、考試、歷選、地選'}
            </p>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
                <button
                  onClick={() => setError("")}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Statistics Cards */}
        {gradeEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 text-white">
              <div className="text-sm text-blue-100 mb-1">總事件數</div>
              <div className="text-3xl font-bold">{stats.overall.totalEvents}</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-4 text-white">
              <div className="text-sm text-green-100 mb-1">已完成</div>
              <div className="text-3xl font-bold">{stats.overall.totalScored}</div>
              <div className="text-xs text-green-100 mt-1">完成度 {stats.overall.completion}%</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-4 text-white">
              <div className="text-sm text-purple-100 mb-1">總體平均</div>
              <div className="text-3xl font-bold">{stats.overall.overallAvg}%</div>
              {stats.overall.overallScore !== '-' && (
                <div className="text-xs text-purple-100 mt-1">
                  {stats.overall.overallScore} / {stats.overall.overallMax}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg p-4 text-white">
              <div className="text-sm text-orange-100 mb-1">科目數</div>
              <div className="text-3xl font-bold">{stats.bySubject.length}</div>
            </div>
          </motion.div>
        )}

        {/* Subject Statistics */}
        {stats.bySubject.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              科目統計
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.bySubject.map((stat, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-gray-900 mb-2">{stat.subject}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">完成度：</span>
                      <span className="font-semibold">{stat.completion}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">已填：</span>
                      <span className="font-semibold">{stat.scored}/{stat.total}</span>
                    </div>
                    {stat.avg !== '-' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均分：</span>
                        <span className="font-semibold text-blue-600">{stat.avg}%</span>
                      </div>
                    )}
                    {stat.avgScore !== '-' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均分數：</span>
                        <span className="font-semibold">{stat.avgScore}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Content: Preview and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              預覽
            </h3>
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt="預覽"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200 mb-2"
                />
                {imageMeta && (
                  <p className="text-xs text-gray-500">{imageMeta}</p>
                )}
              </>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                尚未選擇檔案
              </div>
            )}
          </motion.div>

          {/* Score Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                成績填寫表
              </h3>
              {summaryText && (
                <div className="text-sm text-gray-600 whitespace-pre-line text-right">
                  {summaryText}
                </div>
              )}
            </div>

            {gradeEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                尚未有事件。請先一鍵分析。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">日期</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">週次</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">科目</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">類型</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">項目</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">分數</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">滿分</th>
                      <th className="px-3 py-2 text-left text-sm text-gray-600 border-b border-gray-200">備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeEvents.map((ev, index) => (
                      <motion.tr
                        key={ev.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 text-sm border-b border-gray-100">{ev.date || ev.date_range || ''}</td>
                        <td className="px-3 py-2 text-sm border-b border-gray-100">{ev.week || ''}</td>
                        <td className="px-3 py-2 text-sm border-b border-gray-100">{ev.subject || ''}</td>
                        <td className="px-3 py-2 text-sm border-b border-gray-100">{ev.type || ''}</td>
                        <td className="px-3 py-2 text-sm border-b border-gray-100">
                          {ev.title || ''}
                          {ev.notes && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {ev.notes}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <input
                            type="number"
                            step="0.1"
                            value={ev.score}
                            onChange={(e) => updateEventScore(ev.id, 'score', e.target.value)}
                            className="w-20 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="分數"
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <input
                            type="number"
                            step="0.1"
                            value={ev.maxScore}
                            onChange={(e) => updateEventScore(ev.id, 'maxScore', e.target.value)}
                            className="w-20 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="100"
                          />
                        </td>
                        <td className="px-3 py-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={ev.note}
                            onChange={(e) => updateEventScore(ev.id, 'note', e.target.value)}
                            className="w-32 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="備註"
                          />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
