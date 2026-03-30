import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const JobsListingPage = () => {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", search, location, jobType],
    queryFn: async () => {
      const res = await axiosInstance.get("/jobs", {
        params: { search, location, jobType },
      });
      return res.data;
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, skill, keyword"
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">All types</option>
            <option value="remote">Remote</option>
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="animate-spin" size={16} />
            Loading jobs...
          </div>
        ) : jobs.length ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600">
                      {job.companyId?.companyName || job.companyId?.name} • {job.location} • {job.jobType}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">{job.experienceRequired}</p>
                  </div>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No jobs found.</p>
        )}
      </div>
    </div>
  );
};

export default JobsListingPage;

