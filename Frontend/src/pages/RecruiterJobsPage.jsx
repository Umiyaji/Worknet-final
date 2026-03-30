import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import RecruiterShell from "../components/recruiter/RecruiterShell";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const RecruiterJobsPage = () => {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["recruiterJobs"],
    queryFn: async () => {
      const res = await axiosInstance.get("/jobs/my-jobs");
      return res.data;
    },
  });

  const { mutate: deleteJob, isPending: isDeletingJob } = useMutation({
    mutationFn: async (jobId) => {
      const res = await axiosInstance.delete(`/jobs/${jobId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Job deleted");
      queryClient.invalidateQueries({ queryKey: ["recruiterJobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruiterDashboard"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete job");
    },
  });

  return (
    <RecruiterShell title="My Jobs" subtitle="Manage all jobs posted by your company">
      <div className="flex justify-end">
        <Link
          to="/recruiter/jobs/new"
          className="rounded-md bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
        >
          Post Job
        </Link>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading jobs...</p>
        ) : jobs.length ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-sm text-slate-600">
                      {job.location} • {job.jobType} • {job.experienceRequired}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Apply by {new Date(job.lastDateToApply).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <Link
                      to={`/recruiter/jobs/${job._id}/edit`}
                      className="rounded-md border border-blue-300 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/recruiter/jobs/${job._id}/applicants`}
                      className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
                    >
                      Applicants
                    </Link>
                    <button
                      type="button"
                      disabled={isDeletingJob}
                      onClick={() => deleteJob(job._id)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No jobs posted yet.</p>
        )}
      </div>
    </RecruiterShell>
  );
};

export default RecruiterJobsPage;

