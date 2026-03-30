import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const JobDetailPage = () => {
  const { jobId } = useParams();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [coverLetter, setCoverLetter] = useState("");

  const { data: job, isLoading } = useQuery({
    queryKey: ["jobDetails", jobId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs/${jobId}`);
      return res.data;
    },
    enabled: Boolean(jobId),
  });

  const { mutate: applyToJob, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(`/jobs/${jobId}/apply`, { coverLetter });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Applied successfully");
      setCoverLetter("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to apply");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-700" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center text-slate-500">Job not found.</div>;
  }

  const isRecruiter = authUser?.role === "recruiter";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
        <p className="text-slate-600 mt-2">
          {job.companyId?.companyName || job.companyId?.name} • {job.location} • {job.jobType}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Experience: {job.experienceRequired} • Last date: {new Date(job.lastDateToApply).toLocaleDateString()}
        </p>
        {job.salaryRange ? <p className="text-sm text-slate-500 mt-1">Salary: {job.salaryRange}</p> : null}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Job Description</h3>
        <p className="text-slate-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Skills Required</h3>
        <div className="flex flex-wrap gap-2">
          {job.skillsRequired?.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {!isRecruiter && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Apply to this job</h3>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={4}
            placeholder="Optional cover letter"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => applyToJob()}
            className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          >
            {isPending ? "Applying..." : "Apply Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;

