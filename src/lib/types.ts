export interface StockItem {
  basDt: string;
  srtnCd: string;
  isinCd: string;
  itmsNm: string;
  mrktCtg: string;
  clpr: string;
  mkp: string;
  hipr: string;
  lopr: string;
  vs: string;
  fltRt: string;
  trqu: string;
  trPrc: string;
  lstgStCnt: string;
  mrktTotAmt: string;
}

export interface ItemInfo {
  crno?: string;
  corpNm?: string;
  shotnIsin?: string;
  mktId?: string;
  kindStkcertTpNm?: string;
  parval?: string;
  issuStCnt?: string;
  lstgDt?: string;
  delstgDt?: string;
  [key: string]: string | undefined;
}

export interface CorpInfo {
  indutyNm?: string;
  indutyCd?: string;
  enpBsadr?: string;
  enpRprFnm?: string;
  enpHmpgUrl?: string;
  enpTlno?: string;
  enpEmpeCnt?: string;
  enpEstbDt?: string;
  enpFsclYrCnt?: string;
  bzno?: string;
  enpPbntyCd?: string;
  smenpYn?: string;
  [key: string]: string | undefined;
}

export type SortKey = 'itmsNm' | 'mrktCtg' | 'clpr' | 'vs' | 'fltRt' | 'trqu';
