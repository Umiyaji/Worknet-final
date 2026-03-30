import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { Link, useParams } from "react-router-dom";
import { Building2, MapPin, BriefcaseBusiness, Globe } from "lucide-react";

const RecruiterProfilePage = () => {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["recruiterPublicProfile", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/recruiter/company/${username}`);
      return res.data;
    },
    enabled: Boolean(username),
  });

  if (isLoading) {
    return <div className="text-center text-slate-500 py-10">Loading recruiter profile...</div>;
  }

  if (isError || !data?.recruiter) {
    return <div className="text-center text-slate-500 py-10">Recruiter profile not found.</div>;
  }

  const recruiter = data.recruiter;
  const isOwnRecruiterProfile = authUser?._id === recruiter._id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div
          className="h-48 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 bg-cover bg-center"
          style={{
            backgroundImage: recruiter.companyBanner
              ? `linear-gradient(rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.5)), url('${recruiter.companyBanner}')`
              : undefined,
          }}
        />
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={recruiter.companyLogo || recruiter.profilePicture || "/avatar.png"}
                alt={recruiter.companyName || recruiter.name}
                className="h-20 w-20 rounded-xl object-cover border-4 border-white -mt-12 bg-white shadow-md"
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{recruiter.companyName || recruiter.name}</h1>
                <p className="text-slate-600">{recruiter.industry || "Recruiting"}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                  {recruiter.companyLocation ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} /> {recruiter.companyLocation}
                    </span>
                  ) : null}
                  {recruiter.companyWebsite ? (
                    <a
                      href={recruiter.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800"
                    >
                      <Globe size={14} /> Website
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {isOwnRecruiterProfile ? (
              <Link
                to="/recruiter/jobs/new"
                className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 inline-flex items-center gap-2"
              >
                <BriefcaseBusiness size={16} /> Post Job
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Openings</p>
          <p className="text-3xl font-bold text-slate-900">{data.totalOpenings}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Company Size</p>
          <p className="text-lg font-semibold text-slate-900">{recruiter.companySize || "Not specified"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Hiring Contact</p>
          <p className="text-lg font-semibold text-slate-900">{recruiter.HRName || recruiter.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">About Company</h3>
        <p className="text-slate-700 whitespace-pre-wrap">
          {recruiter.aboutCompany || "No company description added yet."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Open Job Listings</h3>
        {data.openJobs?.length ? (
          <div className="space-y-3">
            {data.openJobs.map((job) => (
              <div key={job._id} className="rounded-lg border border-slate-200 p-4 flex justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{job.title}</p>
                  <p className="text-sm text-slate-600">
                    {job.location} • {job.jobType} • {job.experienceRequired}
                  </p>
                </div>
                <Link to={`/jobs/${job._id}`} className="text-sm text-blue-700 hover:text-blue-800">
                  View Job
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No active job openings right now.</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500 inline-flex items-center gap-1">
          <Building2 size={14} /> Corporate recruiter profile on Worknet
        </p>
      </div>
    </div>
  );
};

export default RecruiterProfilePage;

