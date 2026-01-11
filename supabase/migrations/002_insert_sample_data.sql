-- 插入範例大學資料
-- 在 Supabase SQL Editor 中執行此腳本

INSERT INTO universities (name, name_en, city, type, department, score, quota, competition) VALUES
('國立臺灣大學', 'National Taiwan University', '台北市', 'PUBLIC', '資訊工程學系', '58-60', 45, 3.2),
('國立清華大學', 'National Tsing Hua University', '新竹市', 'PUBLIC', '電機工程學系', '55-58', 50, 2.8),
('國立成功大學', 'National Cheng Kung University', '台南市', 'PUBLIC', '企業管理學系', '50-54', 40, 3.5),
('國立政治大學', 'National Chengchi University', '台北市', 'PUBLIC', '外交學系', '52-55', 35, 2.9),
('國立交通大學', 'National Chiao Tung University', '新竹市', 'PUBLIC', '資訊科學系', '56-59', 48, 3.1),
('國立中央大學', 'National Central University', '桃園市', 'PUBLIC', '數學系', '48-52', 42, 2.6),
('國立中山大學', 'National Sun Yat-sen University', '高雄市', 'PUBLIC', '資訊管理學系', '46-50', 38, 2.5),
('國立中興大學', 'National Chung Hsing University', '台中市', 'PUBLIC', '應用數學系', '44-48', 40, 2.4),
('國立陽明交通大學', 'National Yang Ming Chiao Tung University', '新竹市', 'PUBLIC', '醫學系', '60-65', 30, 4.0),
('國立台灣科技大學', 'National Taiwan University of Science and Technology', '台北市', 'PUBLIC', '資訊工程系', '52-56', 45, 3.0)
ON CONFLICT DO NOTHING;
