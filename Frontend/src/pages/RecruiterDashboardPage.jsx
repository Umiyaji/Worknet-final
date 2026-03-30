import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import RecruiterShell from "../components/recruiter/RecruiterShell";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

const RecruiterDashboardPage = () => {
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [companyForm, setCompanyForm] = useState({
    companyName: authUser?.companyName || "",
    companyWebsite: authUser?.companyWebsite || "",
    companySize: authUser?.companySize || "",
    industry: authUser?.industry || "",
    companyLocation: authUser?.companyLocation || "",
    aboutCompany: authUser?.aboutCompany || "",
    HRName: authUser?.HRName || "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["recruiterDashboard"],
    queryFn: async () => {
      const res = await axiosInstance.get("/recruiter/dashboard");
      return res.data;
    },
  });

  const { mutate: updateCompanyProfile, isPending: isSavingCompanyProfile } = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.put("/recruiter/company-profile", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Company profile updated");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update company profile");
    },
  });

  const needsCompanyProfile = !(authUser?.companyName && authUser?.industry && authUser?.companyLocation);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-700" />
      </div>
    );
  }

  if (isError) {
    return (
      <RecruiterShell title="Recruiter Dashboard" subtitle="Overview of your hiring pipeline">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load recruiter dashboard.
        </div>
      </RecruiterShell>
    );
  }

  return (
    <RecruiterShell title="Recruiter Dashboard" subtitle="Track jobs, applicants, and hiring activity">
      {needsCompanyProfile && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-lg font-semibold text-amber-900">Complete Company Profile</h3>
          <p className="text-sm text-amber-800 mb-4">
            Add your company details so candidates can trust your job postings.
          </p>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              updateCompanyProfile(companyForm);
            }}
          >
            <input
              required
              value={companyForm.companyName}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="Company name"
              className="rounded-md border border-amber-200 px-3 py-2 bg-white"
            />
            <input
              value={companyForm.companyWebsite}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyWebsite: e.target.value }))}
              placeholder="Company website"
              className="rounded-md border border-amber-200 px-3 py-2 bg-white"
            />
            <input
              value={companyForm.industry}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, industry: e.target.value }))}
              placeholder="Industry"
              className="rounded-md border border-amber-200 px-3 py-2 bg-white"
            />
            <input
              value={companyForm.companyLocation}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, companyLocation: e.target.value }))}
              placeholder="Company location"
              className="rounded-md border border-amber-200 px-3 py-2 bg-white"
            />
            <input
              value={companyForm.companySize}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, companySize: e.target.value }))}
              placeholder="Company size"
              className="rounded-md border border-amber-200 px-3 py-2 bg-white"
            />
            <input
              value={companyForm.HRName}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, HRName: e.target.value }))}
              placeholder="HR Name (optional)"
              className="rounded-md border border-amber-200 px-3 py-2 bg-white"
            />
            <textarea
              value={companyForm.aboutCompany}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, aboutCompany: e.target.value }))}
              placeholder="About company"
              rows={3}
              className="rounded-md border border-amber-200 px-3 py-2 bg-white md:col-span-2"
            />
            <button
              type="submit"
              disabled={isSavingCompanyProfile}
              className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 md:col-span-2"
            >
              {isSavingCompanyProfile ? "Saving..." : "Save company profile"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Jobs Posted</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.totalJobsPosted}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Active Jobs</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.activeJobs}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Applicants</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{data.totalApplicants}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Recent Job Posts</h3>
        {data.recentJobs?.length ? (
          <div className="space-y-2">
            {data.recentJobs.map((job) => (
              <div key={job._id} className="rounded-lg border border-slate-200 p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{job.title}</p>
                  <p className="text-sm text-slate-500">
                    {job.location} • {job.jobType}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Apply by {new Date(job.lastDateToApply).toLocaleDateString()}
                </p>
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

export default RecruiterDashboardPage;

