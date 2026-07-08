import React, { useState, useEffect } from "react";
import { MapPin, Loader2, ChevronDown } from "lucide-react";

interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward     { code: number; name: string; }

interface AddressPickerProps {
  /** Hàm gọi về khi người dùng thay đổi địa chỉ */
  onChange: (address: string) => void;
  /** Địa chỉ hiện tại (để hiển thị lại khi edit) */
  defaultValue?: string;
  /** Tên class thêm vào wrapper */
  className?: string;
}

const BASE = "https://provinces.open-api.vn/api";

const selectCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 " +
  "bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 " +
  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent " +
  "transition-all text-sm font-semibold cursor-pointer appearance-none";

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 " +
  "bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 " +
  "placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary " +
  "focus:border-transparent transition-all text-sm font-semibold";

function SelectWrapper({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        {loading
          ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </div>
    </div>
  );
}

export default function AddressPicker({ onChange, defaultValue, className }: AddressPickerProps) {
  const [provinces, setProvinces]       = useState<Province[]>([]);
  const [districts, setDistricts]       = useState<District[]>([]);
  const [wards, setWards]               = useState<Ward[]>([]);

  const [provinceCode, setProvinceCode] = useState<number | "">("");
  const [districtCode, setDistrictCode] = useState<number | "">("");
  const [wardCode, setWardCode]         = useState<number | "">("");
  const [street, setStreet]             = useState("");

  const [loadingP, setLoadingP] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingW, setLoadingW] = useState(false);

  // --- Lấy danh sách 63 tỉnh/thành ---
  useEffect(() => {
    setLoadingP(true);
    fetch(`${BASE}/?depth=1`)
      .then((r) => r.json())
      .then((data: Province[]) => setProvinces(data))
      .catch(console.error)
      .finally(() => setLoadingP(false));
  }, []);

  // --- Lấy quận/huyện khi chọn tỉnh ---
  useEffect(() => {
    if (provinceCode === "") { setDistricts([]); setDistrictCode(""); setWards([]); setWardCode(""); return; }
    setLoadingD(true);
    setDistricts([]); setDistrictCode(""); setWards([]); setWardCode("");
    fetch(`${BASE}/p/${provinceCode}?depth=2`)
      .then((r) => r.json())
      .then((data) => setDistricts(data.districts || []))
      .catch(console.error)
      .finally(() => setLoadingD(false));
  }, [provinceCode]);

  // --- Lấy phường/xã khi chọn quận/huyện ---
  useEffect(() => {
    if (districtCode === "") { setWards([]); setWardCode(""); return; }
    setLoadingW(true);
    setWards([]); setWardCode("");
    fetch(`${BASE}/d/${districtCode}?depth=2`)
      .then((r) => r.json())
      .then((data) => setWards(data.wards || []))
      .catch(console.error)
      .finally(() => setLoadingW(false));
  }, [districtCode]);

  // --- Tổng hợp địa chỉ và gọi onChange ---
  useEffect(() => {
    const provinceName = provinces.find((p) => p.code === provinceCode)?.name ?? "";
    const districtName = districts.find((d) => d.code === districtCode)?.name ?? "";
    const wardName     = wards.find((w) => w.code === wardCode)?.name ?? "";

    const parts = [street.trim(), wardName, districtName, provinceName].filter(Boolean);
    onChange(parts.join(", "));
  }, [street, wardCode, districtCode, provinceCode]);

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {/* Nhãn chung */}
      <div className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
          Địa chỉ liên hệ *
        </span>
      </div>

      {/* Hàng 1: Tỉnh / Thành phố */}
      <SelectWrapper loading={loadingP}>
        <select
          id="address-province"
          value={provinceCode}
          onChange={(e) => setProvinceCode(e.target.value === "" ? "" : Number(e.target.value))}
          className={selectCls}
          required
          disabled={loadingP}
        >
          <option value="">-- Chọn Tỉnh / Thành phố --</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
      </SelectWrapper>

      {/* Hàng 2: Quận / Huyện */}
      <SelectWrapper loading={loadingD}>
        <select
          id="address-district"
          value={districtCode}
          onChange={(e) => setDistrictCode(e.target.value === "" ? "" : Number(e.target.value))}
          className={selectCls}
          required
          disabled={loadingD || provinceCode === ""}
        >
          <option value="">{provinceCode === "" ? "-- Chọn tỉnh trước --" : "-- Chọn Quận / Huyện --"}</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      </SelectWrapper>

      {/* Hàng 3: Phường / Xã */}
      <SelectWrapper loading={loadingW}>
        <select
          id="address-ward"
          value={wardCode}
          onChange={(e) => setWardCode(e.target.value === "" ? "" : Number(e.target.value))}
          className={selectCls}
          required
          disabled={loadingW || districtCode === ""}
        >
          <option value="">{districtCode === "" ? "-- Chọn quận/huyện trước --" : "-- Chọn Phường / Xã --"}</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
      </SelectWrapper>

      {/* Hàng 4: Số nhà, tên đường */}
      <input
        id="address-street"
        type="text"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        placeholder="Số nhà, tên đường (vd: 19 Hoa Bằng)"
        className={inputCls}
        required={provinceCode !== ""}
      />

    </div>
  );
}
