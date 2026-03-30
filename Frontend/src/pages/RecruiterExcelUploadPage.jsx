import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import RecruiterShell from "../components/recruiter/RecruiterShell";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const RecruiterExcelUploadPage = () => {
  const queryClient = useQueryClient();
  const [previewData, setPreviewData] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const { mutate: uploadExcel, isPending: isUploading } = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post("/jobs/upload-excel/preview", formData);
      return res.data;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      toast.success("Excel parsed. Review and publish when ready.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to parse Excel");
    },
  });

  const { mutate: publishJobs, isPending: isPublishing } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post("/jobs/upload-excel/publish", {
        previewToken: previewData.previewToken,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.publishedCount} jobs published successfully`);
      queryClient.invalidateQueries({ queryKey: ["recruiterJobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruiterDashboard"] });
      setPreviewData(null);
      setSelectedFileName("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to publish jobs");
    },
  });

  return (
    <RecruiterShell
      title="AI Excel Upload"
      subtitle="Upload .xlsx file, preview AI-generated job posts, and publish in bulk"
    >
      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
          Upload Excel
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setSelectedFileName(file.name);
              uploadExcel(file);
            }}
          />
        </label>
        {selectedFileName ? <p className="text-sm text-slate-500">Selected: {selectedFileName}</p> : null}
        {isUploading ? <p className="text-sm text-slate-500">Parsing and generating drafts...</p> : null}
      </div>

      {previewData && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Rows: {previewData.totalRows}</p>
              <p className="text-sm text-emerald-600">Valid drafts: {previewData.validRows}</p>
            </div>
            <button
              type="button"
              disabled={isPublishing}
              onClick={() => publishJobs()}
              className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              {isPublishing ? "Publishing..." : "Publish Valid Jobs"}
            </button>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {previewData.drafts.map((entry) => (
              <div key={entry.rowNumber} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">Row {entry.rowNumber}</p>
                  {entry.validationError ? (
                    <span className="text-xs text-red-600">{entry.validationError}</span>
                  ) : (
                    <span className="text-xs text-emerald-600">Ready</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 mt-1">{entry.draft.title || "Untitled draft"}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {entry.draft.location || "Location not set"} • {entry.draft.jobType || "hybrid"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </RecruiterShell>
  );
};

export default RecruiterExcelUploadPage;

