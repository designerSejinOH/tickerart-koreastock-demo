export interface DartCompany {
  corp_code: string;
  corp_name: string;
  corp_name_eng: string;
  stock_code: string;
  ceo_nm: string;       // 대표이사
  corp_cls: string;     // Y=KOSPI K=KOSDAQ N=KONEX
  jurir_no: string;     // 법인등록번호
  bizr_no: string;      // 사업자번호
  adres: string;        // 주소
  hm_url: string;       // 홈페이지
  phn_no: string;       // 전화번호
  induty_code: string;  // 업종코드
  est_dt: string;       // 설립일
  acc_mt: string;       // 결산월
}

export interface DartDisclosure {
  rcept_no: string;   // 접수번호
  corp_name: string;
  report_nm: string;  // 공시명
  rcept_dt: string;   // 접수일자 YYYYMMDD
  rm: string;         // 비고 (정정/첨부 여부)
}

export interface NaverNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface StockContext {
  company: DartCompany | null;
  disclosures: DartDisclosure[];
  news: NaverNewsItem[];
  companyError: string | null;
  disclosureError: string | null;
  newsError: string | null;
}
