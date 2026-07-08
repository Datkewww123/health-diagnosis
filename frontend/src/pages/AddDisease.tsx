import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, Activity, Image, Heart, ShieldAlert, Sparkles } from "lucide-react";
import { createDisease, getAllDiseases, updateDisease, deleteDisease } from "../api/admin";
import { useToast } from "../context/ToastContext";

interface Disease {
  _id: string;
  name: string;
  overview?: string;
  symptoms?: string | string[];
  causes?: string | string[];
  diagnosis?: string | string[];
  treatment?: string | string[];
  doctors?: string | string[];
  departments?: string | string[];
  image_url?: string;
  Precaution_1?: string;
  Precaution_2?: string;
  Precaution_3?: string;
  Precaution_4?: string;
  disease_id?: string;
}

export default function AddDisease() {
  const toast = useToast();

  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [showVi, setShowVi] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    overview: "",
    symptoms: "",
    causes: "",
    diagnosis: "",
    treatment: "",
    doctors: "",
    departments: "",
    image_url: "",
    Precaution_1: "",
    Precaution_2: "",
    Precaution_3: "",
    Precaution_4: "",
    // Vietnamese fields
    name_vi: "",
    overview_vi: "",
    symptoms_vi: "",
    causes_vi: "",
    diagnosis_vi: "",
    treatment_vi: "",
    doctors_vi: "",
    departments_vi: "",
    Precaution_vi: "",
  });

  useEffect(() => {
    loadDiseases();
  }, []);

  async function loadDiseases() {
    try {
      setLoading(true);
      const res = await getAllDiseases();
      const diseaseList = res.diseases || res.data || [];
      setDiseases(diseaseList);
      setFormError(null);
    } catch (err: any) {
      console.error("Error loading diseases:", err);
      setFormError(err.message || "Không thể tải danh sách bệnh.");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Tên bệnh lý không được để trống");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await updateDisease(editingId, formData);
        toast.success("Cập nhật thông tin bệnh lý thành công!");
      } else {
        await createDisease(formData);
        toast.success("Thêm bệnh lý mới thành công!");
      }
      handleCancel();
      await loadDiseases();
    } catch (err: any) {
      console.error("Error saving disease:", err);
      setFormError(err.message || "Có lỗi xảy ra khi lưu thông tin bệnh lý.");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(disease: Disease) {
    setEditingId(disease._id);
    setFormData({
      name: disease.name || "",
      overview: disease.overview || "",
      symptoms: Array.isArray(disease.symptoms)
        ? disease.symptoms.join(", ")
        : (disease.symptoms as string) || "",
      causes: Array.isArray(disease.causes)
        ? disease.causes.join(", ")
        : (disease.causes as string) || "",
      diagnosis: Array.isArray(disease.diagnosis)
        ? disease.diagnosis.join(", ")
        : (disease.diagnosis as string) || "",
      treatment: Array.isArray(disease.treatment)
        ? disease.treatment.join(", ")
        : (disease.treatment as string) || "",
      doctors: Array.isArray(disease.doctors)
        ? disease.doctors.join(", ")
        : (disease.doctors as string) || "",
      departments: Array.isArray(disease.departments)
        ? disease.departments.join(", ")
        : (disease.departments as string) || "",
      image_url: disease.image_url || "",
      Precaution_1: disease.Precaution_1 || "",
      Precaution_2: disease.Precaution_2 || "",
      Precaution_3: disease.Precaution_3 || "",
      Precaution_4: disease.Precaution_4 || "",
      name_vi: (disease as any).name_vi || "",
      overview_vi: (disease as any).overview_vi || "",
      symptoms_vi: (disease as any).symptoms_vi || "",
      causes_vi: (disease as any).causes_vi || "",
      diagnosis_vi: (disease as any).diagnosis_vi || "",
      treatment_vi: (disease as any).treatment_vi || "",
      doctors_vi: (disease as any).doctors_vi || "",
      departments_vi: (disease as any).departments_vi || "",
      Precaution_vi: (disease as any).Precaution_vi || "",
    });
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (window.confirm("Bạn có chắc chắn muốn xóa thông tin bệnh lý này?")) {
      try {
        setLoading(true);
        await deleteDisease(id);
        toast.success("Xóa bệnh lý thành công!");
        await loadDiseases();
      } catch (err: any) {
        console.error("Error deleting disease:", err);
        toast.error(err.message || "Xóa bệnh lý thất bại.");
      } finally {
        setLoading(false);
      }
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      overview: "",
      symptoms: "",
      causes: "",
      diagnosis: "",
      treatment: "",
      doctors: "",
      departments: "",
      image_url: "",
      Precaution_1: "",
      Precaution_2: "",
      Precaution_3: "",
      Precaution_4: "",
      name_vi: "",
      overview_vi: "",
      symptoms_vi: "",
      causes_vi: "",
      diagnosis_vi: "",
      treatment_vi: "",
      doctors_vi: "",
      departments_vi: "",
      Precaution_vi: "",
    });
    setFormError(null);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quản trị hệ thống</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
            Quản lý bệnh lý y khoa
          </h1>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Thêm bệnh mới</span>
          </button>
        )}
      </div>

      {formError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* FORM COMPONENT */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingId ? "Cập nhật thông tin bệnh lý" : "Khai báo bệnh lý mới"}
            </h2>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tên bệnh lý <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Vd: Sốt xuất huyết"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Hình ảnh minh họa (Đường dẫn URL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="Vd: https://example.com/image.jpg"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                  />
                  <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tổng quan bệnh học
              </label>
              <textarea
                name="overview"
                value={formData.overview}
                onChange={handleInputChange}
                placeholder="Nhập mô tả tổng quan về bệnh lý..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Các triệu chứng (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Vd: sốt, đau đầu, phát ban"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Nguyên nhân (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="causes"
                  value={formData.causes}
                  onChange={handleInputChange}
                  placeholder="Vd: virus Dengue, muỗi vằn truyền bệnh"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chẩn đoán lâm sàng (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  placeholder="Vd: xét nghiệm máu, khám lâm sàng"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Hướng điều trị (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleInputChange}
                  placeholder="Vd: uống nước nhiều, dùng thuốc hạ sốt"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Khoa/Phòng khám phụ trách
                </label>
                <input
                  type="text"
                  name="departments"
                  value={formData.departments}
                  onChange={handleInputChange}
                  placeholder="Vd: Khoa truyền nhiễm, Khoa nội tổng quát"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Bác sĩ đề xuất (Phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  name="doctors"
                  value={formData.doctors}
                  onChange={handleInputChange}
                  placeholder="Vd: Bác sĩ Nguyễn Văn A"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* PRECAUTIONS */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
              <label className="block mb-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Biện pháp phòng ngừa bệnh lý (Tối đa 4 biện pháp)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "Precaution_1", label: "Biện pháp 1", color: "border-sky-500" },
                  { key: "Precaution_2", label: "Biện pháp 2", color: "border-amber-500" },
                  { key: "Precaution_3", label: "Biện pháp 3", color: "border-emerald-500" },
                  { key: "Precaution_4", label: "Biện pháp 4", color: "border-purple-500" },
                ].map((item) => (
                  <div key={item.key}>
                    <input
                      type="text"
                      name={item.key}
                      value={(formData as any)[item.key]}
                      onChange={handleInputChange}
                      placeholder={item.label}
                      className={`w-full px-4 py-2.5 rounded-xl border-l-4 ${item.color} border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-semibold`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* VIETNAMESE SECTION TOGGLE */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowVi(!showVi)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
              >
                <span className={`transition-transform ${showVi ? "rotate-90" : ""}`}>▶</span>
                {showVi ? "Ẩn thông tin tiếng Việt" : "Hiển thị thêm thông tin tiếng Việt"}
              </button>
            </div>

            {showVi && (
              <div className="space-y-4 p-4 bg-sky-50/30 dark:bg-sky-950/5 rounded-2xl border border-sky-100 dark:border-sky-900/20">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Thông tin tiếng Việt
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tên bệnh (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="name_vi"
                      value={formData.name_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: Sốt xuất huyết Dengue"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tổng quan (Tiếng Việt)
                  </label>
                  <textarea
                    name="overview_vi"
                    value={formData.overview_vi}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả tổng quan bằng tiếng Việt..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Triệu chứng (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="symptoms_vi"
                      value={formData.symptoms_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: sốt, đau đầu, phát ban"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Nguyên nhân (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="causes_vi"
                      value={formData.causes_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: virus Dengue, muỗi vằn truyền bệnh"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Chẩn đoán (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="diagnosis_vi"
                      value={formData.diagnosis_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: xét nghiệm máu, khám lâm sàng"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Điều trị (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="treatment_vi"
                      value={formData.treatment_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: uống nước nhiều, dùng thuốc hạ sốt"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Khoa/Phòng khám (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="departments_vi"
                      value={formData.departments_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: Khoa truyền nhiễm"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Bác sĩ (Tiếng Việt)
                    </label>
                    <input
                      type="text"
                      name="doctors_vi"
                      value={formData.doctors_vi}
                      onChange={handleInputChange}
                      placeholder="Vd: Bác sĩ Nguyễn Văn A"
                      className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Biện pháp phòng ngừa (Tiếng Việt)
                  </label>
                  <textarea
                    name="Precaution_vi"
                    value={formData.Precaution_vi}
                    onChange={handleInputChange}
                    placeholder="Nhập các biện pháp phòng ngừa, phân cách bằng dấu phẩy..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm font-semibold resize-none"
                  />
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary hover:bg-primary-dark disabled:bg-slate-350 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
              >
                {loading ? "Đang lưu..." : editingId ? "Cập nhật bệnh lý" : "Thêm bệnh lý"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DISEASES LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Danh sách bệnh lý y khoa hiện có
        </h2>

        {loading && !showForm ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : diseases.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Chưa có bệnh lý nào được khai báo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diseases.map((disease) => (
              <div
                key={disease._id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {disease.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-2">                  Mã bệnh: {disease.disease_id || "Không có"}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {disease.overview || "Chưa có thông tin tổng quan bệnh lý."}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleEdit(disease)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-accent hover:text-white dark:bg-slate-800 dark:hover:bg-accent dark:hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDelete(disease._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 text-xs font-bold rounded-xl border border-rose-100/50 hover:border-transparent transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
