import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import { resolveResumeUrl } from "../lib/resumeUrl";
import { toast } from "react-hot-toast";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";

const Resume = () => {
  const { username } = useParams();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const [resumeUploadProgress, setResumeUploadProgress] = useState(0);
  const isOwnResume = !username || username === authUser?.username;

  const { data: selectedUser, isLoading: isSelectedUserLoading } = useQuery({
    queryKey: ["resumeUserProfile", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/${username}`);
      return res.data;
    },
    enabled: Boolean(username) && !isOwnResume,
  });

  const resumeOwner = isOwnResume ? authUser : selectedUser;
  const resumeUrl = resumeOwner?.resume;
  const normalizedResumeUrl = resolveResumeUrl(resumeUrl);

  const { mutate: uploadResume, isLoading: isUploadingResume } = useMutation({
    mutationFn: async (file) => {
      setResumeUploadProgress(0);
      const formData = new FormData();
      formData.append("resume", file);

      const res = await axiosInstance.post(
        "/users/resume",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setResumeUploadProgress(percent);
          },
        },
      );

      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["authUser"], (prev) => ({
        ...prev,
        ...updatedUser,
      }));
      queryClient.invalidateQueries(["authUser"]);
      setResumeUploadProgress(100);
      toast.success("Resume uploaded successfully");
    },
    onError: (error) => {
      setResumeUploadProgress(0);
      toast.error(error.response?.data?.message || "Failed to upload resume");
    },
    onSettled: () => {
      setTimeout(() => setResumeUploadProgress(0), 600);
    },
  });

  const { mutate: deleteResume, isLoading: isDeletingResume } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.delete("/users/resume");
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["authUser"], (prev) => ({
        ...prev,
        ...updatedUser,
      }));
      queryClient.invalidateQueries(["authUser"]);
      toast.success("Resume deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete resume");
    },
  });

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const isAllowedFile =
      allowedMimeTypes.includes(file.type) ||
      /\.(pdf|doc|docx|jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isAllowedFile) {
      toast.error("Please upload a PDF, DOC, DOCX, JPG, PNG, or WEBP file");
      event.target.value = "";
      return;
    }

    uploadResume(file);
    event.target.value = "";
  };

  if (isSelectedUserLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!resumeUrl) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          <FileUp size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            No Resume Available
          </h2>
          <p className="text-gray-600 mb-6">
            {isOwnResume
              ? "Upload your resume here to display it in your resume section."
              : `${resumeOwner?.name || "This user"} has not uploaded a resume yet.`}
          </p>

          {isOwnResume ? (
            <>
              <label
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-2 text-white transition ${
                  isUploadingResume
                    ? "cursor-not-allowed bg-blue-400"
                    : "cursor-pointer bg-primary hover:bg-primary-dark"
                }`}
              >
                {isUploadingResume ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileUp size={18} />
                )}
                Upload Resume
                <input
                  type="file"
                  className="hidden"
                  onChange={handleResumeChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  disabled={isUploadingResume}
                />
              </label>

              {isUploadingResume && (
                <div className="mt-6 text-left">
                  <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                    <span>Uploading resume...</span>
                    <span>{resumeUploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${resumeUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              to={`/profile/${resumeOwner?.username || username}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-white transition hover:bg-primary-dark"
            >
              Back to Profile
            </Link>
          )}
        </div>
      </div>
    );
  }

  const pageTitle = isOwnResume
    ? "Resume"
    : `${resumeOwner?.name || "User"}'s Resume`;
  const pageSubtitle = isOwnResume
    ? "Resume uploaded. You can download, update, or delete it."
    : `Viewing ${resumeOwner?.name || "this user's"} resume.`;
  const isPDF =
    /\.pdf($|[?#])/i.test(normalizedResumeUrl || "") ||
    /format=pdf/i.test(normalizedResumeUrl || "") ||
    /\/pdf\//i.test(normalizedResumeUrl || "");
  const isLocalResume =
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(
      normalizedResumeUrl || "",
    ) ||
    normalizedResumeUrl?.startsWith(window.location.origin);
  const pdfPreviewUrl = isPDF
    ? isLocalResume
      ? normalizedResumeUrl
      : `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(normalizedResumeUrl)}`
    : normalizedResumeUrl;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        {/* Header with download button */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
            <p className="text-sm text-gray-500">{pageSubtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={normalizedResumeUrl}
              download
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-primary-dark"
            >
              <Download size={20} />
              Download
            </a>

            <a
              href={normalizedResumeUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100"
            >
              Open
            </a>

            {isOwnResume ? (
              <>
                <label
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition ${
                    isUploadingResume
                      ? "cursor-not-allowed bg-blue-400"
                      : "cursor-pointer bg-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {isUploadingResume ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileUp size={18} />
                  )}
                  Update Resume
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleResumeChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    disabled={isUploadingResume}
                  />
                </label>

                <button
                  onClick={() => deleteResume()}
                  disabled={isDeletingResume || isUploadingResume}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingResume ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Delete Resume
                </button>
              </>
            ) : (
              <Link
                to={`/profile/${resumeOwner?.username || username}`}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-100"
              >
                Back to Profile
              </Link>
            )}
          </div>
        </div>

        {isOwnResume && isUploadingResume && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
              <span>Updating resume...</span>
              <span>{resumeUploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${resumeUploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* PDF Viewer or Image */}
        {isPDF ? (
          <div className="space-y-3">
            <iframe
              src={pdfPreviewUrl}
              title="Resume PDF"
              className="w-full h-[600px] sm:h-[800px] border border-gray-300 rounded-lg bg-white"
              style={{ minHeight: "600px" }}
            />
            <p className="text-sm text-gray-500 text-center">
              If the preview still does not load, use Open or Download above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <img
              className="w-full h-auto rounded-xl border border-gray-200"
              src={normalizedResumeUrl}
              alt="Resume"
            />
            <p className="text-sm text-gray-600 text-center">
              Resume uploaded as image. Click download to get the original file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resume;
