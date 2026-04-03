export function formatNum(n: string | number): string {
  return Number(n).toLocaleString('ko-KR');
}

export function formatDate(s: string): string {
  if (!s || s.length < 8) return '—';
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const NUM_FIELDS = new Set([
  'clpr', 'mkp', 'hipr', 'lopr', 'vs', 'trqu', 'trPrc',
  'lstgStCnt', 'mrktTotAmt', 'parval', 'issuStCnt',
]);

const DATE_FIELDS = new Set(['basDt', 'lstgDt', 'delstgDt', 'enpEstbDt']);

export function formatFieldValue(key: string, val: string | number | undefined): string {
  if (val == null || val === '') return '—';
  if (DATE_FIELDS.has(key)) return formatDate(String(val));
  if (key === 'fltRt') return `${Number(val) >= 0 ? '+' : ''}${Number(val).toFixed(2)}%`;
  if (key === 'mrktTotAmt' || key === 'trPrc') {
    const v = Number(val);
    if (v >= 1e12) return `${(v / 1e12).toFixed(2)}조`;
    if (v >= 1e8) return `${(v / 1e8).toFixed(0)}억`;
    return formatNum(v);
  }
  if (NUM_FIELDS.has(key)) return formatNum(val);
  return String(val);
}

export const FIELD_LABELS: Record<string, string> = {
  basDt: '기준일자', srtnCd: '단축코드', isinCd: 'ISIN 코드',
  itmsNm: '종목명', mrktCtg: '시장구분',
  clpr: '종가', mkp: '시가', hipr: '고가', lopr: '저가',
  vs: '전일대비', fltRt: '등락률',
  trqu: '거래량', trPrc: '거래대금',
  lstgStCnt: '상장주식수', mrktTotAmt: '시가총액',
  crno: '법인등록번호', corpNm: '법인명',
  shotnIsin: '단축ISIN', mktId: '시장ID',
  kindStkcertTpNm: '종목유형',
  parval: '액면가', issuStCnt: '발행주식수',
  lstgDt: '상장일', delstgDt: '상장폐지일',
  indutyNm: '업종명', indutyCd: '업종코드',
  enpBsadr: '본사주소', enpRprFnm: '대표자명',
  enpHmpgUrl: '홈페이지', enpTlno: '대표전화',
  enpEmpeCnt: '직원수', enpEstbDt: '설립일',
  enpFsclYrCnt: '결산월', bzno: '사업자번호',
  enpPbntyCd: '상장구분', smenpYn: '중소기업여부',
};
