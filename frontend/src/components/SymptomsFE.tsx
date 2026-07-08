import React, { useState } from "react";
import { useApi } from "../hooks/useApi";
import { predictSymptoms, getDiseaseDetail } from "../api/symptoms";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import Badge from "./ui/Badge";
import { useToast } from "../context/ToastContext";

export default function SymptomsFE() {
  const [input, setInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const { toast } = useToast();

  const checkApi = useApi(predictSymptoms);
  const detailApi = useApi(getDiseaseDetail);

  const handleCheckSymptoms = async () => {
    if (!input.trim()) return;
    const updated = [...symptoms, input.trim()];
    setSymptoms(updated);
    setInput("");

    try {
      await checkApi.request(updated);
    } catch (err: any) {
      toast(err.message || "Failed to analyze symptoms", "error");
    }
  };

  const getDetail = async (id: string) => {
    try {
      const data = await detailApi.request(id);
      toast(`Disease Detail: ${JSON.stringify(data.data || data)}`, "info");
    } catch (err: any) {
      toast(err.message || "Failed to fetch details", "error");
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Symptom Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập triệu chứng..."
            onKeyDown={(e) => e.key === "Enter" && handleCheckSymptoms()}
          />
          <Button onClick={handleCheckSymptoms} disabled={checkApi.loading}>
            Gửi
          </Button>
        </div>

        {symptoms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2">
            {symptoms.map((s, idx) => (
              <Badge key={idx} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {checkApi.error && <div className="text-sm text-rose-500 font-medium">{checkApi.error}</div>}

        {checkApi.data && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              Kết quả ({(checkApi.data as any).count})
            </h3>
            <ul className="space-y-2">
              {((checkApi.data as any).data || []).map((d: any) => (
                <li
                  key={d._id}
                  className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg"
                >
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-350">{d.name || d.name_vi}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Score: {d.score}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => getDetail(d._id)} disabled={detailApi.loading}>
                    Chi tiết
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
