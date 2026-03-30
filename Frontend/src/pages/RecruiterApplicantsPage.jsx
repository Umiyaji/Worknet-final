import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import RecruiterShell from "../components/recruiter/RecruiterShell";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const RecruiterApplicantsPage = () => {
  const { jobId } = useParams();
  const [selectedJobId, setSelectedJobId] = useState(jobId || "");

  const { data: jobs = [] } = useQuery({
    queryKey: ["recruiterJobs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/jobs/my-jobs");
      return res.data;
    },
  });

  const effectiveJobId = selectedJobId || jobs[0]?._id || "";

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["jobApplicants", effectiveJobId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/jobs/${effectiveJobId}/applicants`);
      return res.data;
    },
    enabled: Boolean(effectiveJobId),
  });

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === effectiveJobId),
    [jobs, effectiveJobId],
  );

  return (
    <RecruiterShell title="Applicants" subtitle="Review candidates who applied to your jobs">
      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <label className="text-sm text-slate-600">Select Job</label>
        <select
          value={effectiveJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
        >
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          {selectedJob ? `Applicants for ${selectedJob.title}` : "Applicants"}
        </h3>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading applicants...</p>
        ) : applicants.length ? (
          <div className="space-y-3">
            {applicants.map((application) => (
              <div key={application._id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{application.userId?.name}</p>
                <p className="text-sm text-slate-600">@{application.userId?.username}</p>
                <p className="text-sm text-slate-600">{application.userId?.headline || "Candidate"}</p>
                {application.coverLetter ? (
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{application.coverLetter}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No applicants yet.</p>
        )}
      </div>
    </RecruiterShell>
  );
};

export default RecruiterApplicantsPage;

