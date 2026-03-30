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
      <input
        type="text"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input input-bordered w-full p-2 border border-blue-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-red-600"
        required
      />
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="input input-bordered w-full p-2 border border-blue-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-red-600"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input input-bordered w-full p-2 border border-blue-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-red-600"
        required
      />
      <input
        type="password"
        placeholder="Password (6+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input input-bordered w-full p-2 border border-blue-300 rounded-md hover:border-blue-500 focus:outline-none focus:border-red-600"
        required
      />

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={registerAsRecruiter}
          onChange={(e) => setRegisterAsRecruiter(e.target.checked)}
          className="h-4 w-4"
        />
        Register as Recruiter / Company
      </label>

      {registerAsRecruiter && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded-md"
            required
          />
          <input
            type="url"
            placeholder="Company Website"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded-md"
          />
          <select
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded-md bg-white"
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
            className="w-full p-2 border border-blue-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Company Location"
            value={companyLocation}
            onChange={(e) => setCompanyLocation(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded-md"
          />
          <input
            type="text"
            placeholder="HR Name (optional)"
            value={HRName}
            onChange={(e) => setHRName(e.target.value)}
            className="w-full p-2 border border-blue-300 rounded-md"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary w-full cursor-pointer border rounded-md p-2 bg-primary text-white hover:bg-primary-dark font-semibold flex justify-center items-center gap-2"
      >
        {isPending ? (
          <>
            <Loader className="size-5 animate-spin" />
            <span>Signing Up...</span>
          </>
        ) : (
          "Agree & Join"
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-sm text-gray-500">Or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

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
    </form>
  );
};
export default SignUpForm;
