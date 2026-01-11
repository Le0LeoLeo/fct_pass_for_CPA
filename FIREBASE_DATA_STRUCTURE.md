# Firebase 數據結構文檔

## 已完成的更新

✅ **更新了 University 接口定義**
- `src/services/firebase.ts` - 完整的 Firebase 數據結構
- `src/services/supabase.ts` - 兼容的 Supabase 數據結構

✅ **更新了數據顯示邏輯**
- `src/components/UniversityDatabasePage.tsx` - 更新了 `getUniversityDisplayData` 函數以使用新的數據結構

## Firebase 數據結構

### 基本字段

```typescript
{
  id: string;
  name: string;                    // 中文名稱，如 "山東大學"
  nameEn: string;                  // 英文名稱，如 "Shandong University"
  city: string;                    // 城市，如 "濟南市"
  district: string;                // 區，如 "歷城區"
  address: string;                 // 完整地址，如 "山東省濟南市歷城區山大南路27號"
  type: "PUBLIC" | "PRIVATE";      // 學校類型
  founded: number;                 // 創立年份，如 1901
  website: string;                 // 官方網站 URL
}
```

### 聯繫信息 (contact)

```typescript
contact: {
  email: string;                   // 如 "sdbkzs@sdu.edu.cn"
  phone: string;                   // 如 "+86-531-88364787"
  fax: string | null;              // 傳真號碼（可為 null）
}
```

### 專業和學科

```typescript
majors: string[];                  // 專業列表，如 ["計算機科學", "軟件工程", ...]
disciplines: string[];             // 學科列表，如 ["數學", "化學", "臨床醫學", ...]
```

### 錄取分數 (admission_scores)

```typescript
admission_scores: {
  admission_min: number;          // 最低錄取分數，如 380
  tier: string;                   // 層級，如 "Tier 3"
}
```

### 排名 (ranking)

```typescript
ranking: {
  domestic: number;               // 國內排名，如 22
  qs: number;                     // QS 排名，如 443
  timesHigherEd: number;          // THE 排名，如 401
  lastUpdated: string | null;     // 最後更新時間
}
```

### 學費 (tuition)

```typescript
tuition: {
  undergraduate: {
    currency: string;              // 貨幣，如 "CNY"
    perYear: number;               // 每年學費，如 16000
    perSemester: number;           // 每學期學費，如 8000
  };
  graduate: {
    currency: string;              // 貨幣，如 "CNY"
    perYear: number;               // 每年學費，如 18000
    perSemester: number;           // 每學期學費，如 9000
  };
}
```

### 其他字段

```typescript
images: string[] | null;           // 圖片 URL 數組
statistics: any;                   // 統計數據
metadata: any;                     // 元數據
updated_at: timestamp;             // 更新時間戳
```

## 顯示邏輯

### 數據提取優先順序

1. **名稱**: `name` > `nameEn` > "未知大學"
2. **專業**: `majors[0]` > `department` > "未指定科系"
3. **錄取分數**: `admission_scores.admission_min` > `score` > "N/A"

### 詳情頁面顯示內容

- ✅ 基本資訊：地區、區、地址、創立年份
- ✅ 錄取分數：最低錄取分數和層級
- ✅ 聯繫信息：電話和郵箱
- ✅ 排名資訊：國內排名、QS 排名、THE 排名
- ✅ 專業設置：顯示前 10 個專業，超過顯示 "+N 更多"
- ✅ 學費資訊：本科和研究生學費
- ✅ 官方網站：可點擊的鏈接
- ✅ 相關專業：側邊欄顯示專業列表

## 使用示例

```typescript
// 從 Firebase 載入數據
import { loadUniversities } from './services/database';

const universities = await loadUniversities();

// 訪問數據
const university = universities[0];
console.log(university.name);                    // "山東大學"
console.log(university.contact?.email);         // "sdbkzs@sdu.edu.cn"
console.log(university.admission_scores?.admission_min); // 380
console.log(university.ranking?.domestic);      // 22
console.log(university.majors?.[0]);            // "計算機科學"
```

## 注意事項

1. 所有字段都是可選的（使用 `?` 標記）
2. 使用 `||` 運算符提供默認值
3. 數組字段（如 `majors`）需要檢查長度再顯示
4. 嵌套對象（如 `contact.email`）需要使用可選鏈 `?.`

## 未來擴展

可以考慮添加：
- 搜索過濾功能（按專業、排名、學費等）
- 數據可視化（排名趨勢圖、學費對比等）
- 收藏功能（將大學保存到用戶收藏列表）
