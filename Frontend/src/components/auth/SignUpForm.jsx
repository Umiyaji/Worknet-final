import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios.js";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";
import GoogleLoginComp from "../googleLoginComp.jsx";

const companySizeOptions = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
];

const fieldClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100";

const SignUpForm = ({ defaultRecruiter = false }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerAsRecruiter, setRegisterAsRecruiter] = useState(defaultRecruiter);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState(companySizeOptions[0]);
  const [industry, setIndustry] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [HRName, setHRName] = useState("");

  const queryClient = useQueryClient();

  const { mutate: signUpMutation, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/signup", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        data?.role === "recruiter"
          ? "Recruiter account created successfully"
          : "Account created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong");
    },
  });

  const handleSignUp = (e) => {
    e.preventDefault();

    const payload = {
      name,
      username,
      email,
      password,
      role: registerAsRecruiter ? "recruiter" : "user",
    };

    if (registerAsRecruiter) {
      payload.companyName = companyName;
      payload.companyWebsite = companyWebsite;
      payload.companySize = companySize;
      payload.industry = industry;
      payload.companyLocation = companyLocation;
      payload.HRName = HRName;
    }

    signUpMutation(payload);
  };

  return (
    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label htmlFor="signup-name" className="text-sm font-medium text-slate-700">
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          placeholder="e.g. Priya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-username" className="text-sm font-medium text-slate-700">
          Username
        </label>
        <input
          id="signup-username"
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClassName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          placeholder="6+ characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldClassName}
          required
        />
      </div>

      <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={registerAsRecruiter}
          onChange={(e) => setRegisterAsRecruiter(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span>Register as Recruiter / Company</span>
      </label>

      {registerAsRecruiter && (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">Company Details</h3>

          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={fieldClassName}
            required
          />
          <input
            type="url"
            placeholder="Company Website"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            className={fieldClassName}
          />
          <select
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            className={fieldClassName}
          >
            {companySizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={fieldClassName}
          />
          <input
            type="text"
            placeholder="Company Location"
            value={companyLocation}
            onChange={(e) => setCompanyLocation(e.target.value)}
            className={fieldClassName}
          />
          <input
            type="text"
            placeholder="HR Name (optional)"
            value={HRName}
            onChange={(e) => setHRName(e.target.value)}
            className={fieldClassName}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? (
          <>
            <Loader className="size-5 animate-spin" />
            <span>Signing up...</span>
          </>
        ) : (
          "Agree & Join"
        )}
      </button>

      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Or continue with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
        <GoogleLoginComp
          authRole={registerAsRecruiter ? "recruiter" : "user"}
          extraPayload={
            registerAsRecruiter
              ? {
                  companyName,
                  companyWebsite,
                  companySize,
                  industry,
                  companyLocation,
                  HRName,
                }
              : {}
          }
          onSuccessNavigateTo={registerAsRecruiter ? "/recruiter/dashboard" : "/"}
        />
      </div>
    </form>
  );
};

export default SignUpForm;
