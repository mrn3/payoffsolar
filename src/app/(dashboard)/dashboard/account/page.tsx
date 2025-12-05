"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from "@/components/ui/PhoneInput";
import { isValidPhoneNumber } from "@/lib/utils/phone";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || isValidPhoneNumber(value), {
      message: "Please enter a valid phone number",
    }),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Current password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z
      .string()
      .min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
	    control,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: savingPassword },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        const p = data.profile;
        setValue("firstName", p.first_name || "");
        setValue("lastName", p.last_name || "");
        setValue("email", p.email || "");
        setValue("phone", p.phone || "");
      } catch (err) {
        console.error(err);
        setProfileError(
          err instanceof Error ? err.message : "Failed to load profile"
        );
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [setValue]);

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setProfileError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

	      if (!res.ok) {
	        const data = await res.json().catch(() => null);
	        throw new Error(data?.error || "Failed to update profile");
	      }

	      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      setProfileError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    }
  };

  const onSubmitPassword = async (values: PasswordFormValues) => {
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to change password");
      }

      setPasswordMessage("Password updated successfully");
      resetPasswordForm();
    } catch (err) {
      console.error(err);
      setPasswordMessage(
        err instanceof Error ? err.message : "Failed to change password"
      );
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload avatar");
      }

      // Simple way to reflect avatar change: refresh page
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Failed to upload avatar. Please try again."
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile, contact information, password, and profile
          picture.
        </p>
      </div>

      <section className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        {profileError && (
          <p className="text-sm text-red-600">{profileError}</p>
        )}
        <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                type="text"
                {...register("firstName")}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  profileErrors.firstName
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              />
              {profileErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                type="text"
                {...register("lastName")}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                {...register("email")}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  profileErrors.email ? "border-red-300" : "border-gray-300"
                }`}
              />
              {profileErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone number (optional)
              </label>
	              <Controller
	                name="phone"
	                control={control}
	                render={({ field }) => (
	                  <PhoneInput
	                    name={field.name}
	                    value={field.value || ""}
	                    onChange={field.onChange}
	                    onBlur={field.onBlur}
	                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
	                      profileErrors.phone ? "border-red-300" : "border-gray-300"
	                    }`}
	                  />
	                )}
	              />
              {profileErrors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        {passwordMessage && (
          <p
            className={`text-sm ${
              passwordMessage.includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {passwordMessage}
          </p>
        )}
        <form
          onSubmit={handlePasswordSubmit(onSubmitPassword)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current password
              </label>
              <input
                type="password"
                {...registerPassword("currentPassword")}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  passwordErrors.currentPassword
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                type="password"
                {...registerPassword("newPassword")}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  passwordErrors.newPassword
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                type="password"
                {...registerPassword("confirmNewPassword")}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm ${
                  passwordErrors.confirmNewPassword
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              />
              {passwordErrors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {passwordErrors.confirmNewPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white shadow rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Profile Picture</h2>
        <p className="text-sm text-gray-500">
          Upload a profile picture to personalize your account.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
          />
          {avatarUploading && (
            <p className="text-sm text-gray-500">Uploading...</p>
          )}
        </div>
      </section>
    </div>
  );
}

