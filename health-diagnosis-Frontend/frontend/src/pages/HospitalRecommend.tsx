import React, { useState } from "react";
import { MapPin, Phone, Globe, Building2, HelpCircle } from "lucide-react";
import { hospitals } from "../data/hospitals";

export default function HospitalRecommend() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Get unique departments from all hospitals
  const allDepartments = Array.from(
    new Set(hospitals.flatMap((h) => h.departments))
  ).sort();

  // Filter hospitals by selected department
  const filteredHospitals = selectedDepartment
    ? hospitals.filter((h) => h.departments.includes(selectedDepartment))
    : hospitals;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hỗ trợ tìm kiếm cơ sở y tế</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100">
          🏥 Cơ sở y tế đề xuất
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Danh sách các bệnh viện lớn chất lượng hàng đầu Việt Nam phân loại theo các chuyên khoa trọng điểm.
        </p>
      </div>

      {/* FILTER BY DEPARTMENT CARD */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <label className="block text-sm font-bold text-slate-850 dark:text-slate-300 uppercase tracking-wider">
          Lọc theo chuyên khoa chính:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDepartment(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              !selectedDepartment
                ? "bg-primary border-primary text-white"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            Tất cả phòng khoa
          </button>
          {allDepartments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedDepartment === dept
                  ? "bg-primary border-primary text-white"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* HOSPITALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.length > 0 ? (
          filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Hospital Image */}
              <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
                <img
                  src={hospital.image_url}
                  alt={hospital.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Hospital Information */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-100 leading-tight">
                    {hospital.name}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Địa điểm: <strong className="text-slate-700 dark:text-slate-300">{hospital.location}</strong></span>
                    </div>

                    <div className="pl-6 text-[11px] leading-relaxed text-slate-400 font-medium">
                      {hospital.address}
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>SĐT: <a href={`tel:${hospital.phone}`} className="text-primary hover:underline font-bold">{hospital.phone}</a></span>
                    </div>
                  </div>

                  {/* Departments Tags */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Các khoa mũi nhọn:</span>
                    <div className="flex flex-wrap gap-1">
                      {hospital.departments.map((dept) => (
                        <span
                          key={dept}
                          className="px-2 py-0.5 bg-slate-55 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md text-[10px] font-bold border border-slate-200/50 dark:border-slate-800"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Web Link Button */}
                <a
                  href={hospital.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md mt-auto"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Ghé thăm trang web</span>
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-2xl text-center space-y-2">
            <HelpCircle className="h-10 w-10 text-slate-350 mx-auto" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Không tìm thấy cơ sở y tế nào phụ trách chuyên khoa này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
