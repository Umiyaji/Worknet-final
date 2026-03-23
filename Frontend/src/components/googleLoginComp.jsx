import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const GoogleLoginComp = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleonSuccess = async (credResponse) => {
    try {
      // Send the token to your backend
      const res = await axiosInstance.post("/auth/google", {
        token: credResponse.credential,
      });

      toast.success("Login successful!");
      // Invalidate auth query to update the logged-in user
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.response?.data?.message || "Google login failed");
    }
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={(credentialResponse) => handleonSuccess(credentialResponse)}
        onError={() => {
          toast.error("Google login failed");
          console.log("Login Failed");
        }}
      />
    </div>
  );
};

export default GoogleLoginComp;
