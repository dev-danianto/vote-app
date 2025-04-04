import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR URL KEY";
const supabaseKey = "YOUR API KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const Profile = ({ language = "id" }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    website: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.avatar_url) {
      downloadImage(profile.avatar_url);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError(
          language === "id"
            ? "Silakan login terlebih dahulu"
            : "Please login first"
        );
        setLoading(false);
        return;
      }

      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        const tempProfile = {
          id: user.id,
          full_name:
            user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          website: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setProfile(tempProfile);
        setFormData({
          fullName: tempProfile.full_name || "",
          email: user.email || "",
          website: tempProfile.website || "",
        });
        setLoading(false);
        return;
      }

      const profile = data[0];

      setProfile(profile);
      setFormData({
        fullName: profile.full_name || "",
        email: user.email || "",
        website: profile.website || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (path) => {
    try {
      if (!path) {
        console.log("No avatar path found");
        return;
      }

      if (path.startsWith("http")) {
        setAvatarUrl(path);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);

      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
        return;
      }

      const { data: fileData, error } = await supabase.storage
        .from("avatars")
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(fileData);
      setAvatarUrl(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      setAvatarUrl(null);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploadLoading(true);
      setError(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error(
          language === "id"
            ? "Anda harus memilih gambar untuk diunggah"
            : "You must select an image to upload"
        );
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const fileName = `${user.id}/${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: fileName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatar(file);
      if (urlData?.publicUrl) {
        setAvatarUrl(urlData.publicUrl);
      }

      setSuccessMessage(
        language === "id"
          ? "Foto profil berhasil diperbarui"
          : "Profile picture successfully updated"
      );

      await fetchProfile();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setError(error.message);
    } finally {
      setUploadLoading(false);
      if (successMessage) {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user)
        throw new Error(
          language === "id" ? "Tidak ditemukan pengguna" : "No user found"
        );

      if (user.email !== formData.email) {
        const { error: emailUpdateError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailUpdateError) throw emailUpdateError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          website: formData.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setSuccessMessage(
        language === "id"
          ? "Profil berhasil diperbarui"
          : "Profile successfully updated"
      );

      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      if (successMessage) {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-full w-full py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 m-4 bg-red-100 text-red-700 rounded-md">{error}</div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {language === "id" ? "Profil Pengguna" : "User Profile"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {language === "id"
            ? "Kelola informasi pribadi Anda"
            : "Manage your personal information"}
        </p>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center"
          role="alert"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center"
          role="alert"
        >
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 flex-1">
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error("Error loading image");
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentNode.querySelector(
                          ".fallback-avatar"
                        ).style.display = "flex";
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-blue-100 text-blue-600 text-2xl font-bold">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div
                    className="fallback-avatar flex items-center justify-center h-full w-full bg-blue-100 text-blue-600 text-2xl font-bold"
                    style={{ display: "none" }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                </div>
                {editing && (
                  <div className="absolute bottom-0 right-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="bg-blue-600 text-white rounded-full p-2 shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? (
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      type="file"
                      id="avatar"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={uploadAvatar}
                      className="hidden"
                      disabled={uploadLoading}
                    />
                  </div>
                )}
              </div>

              {uploadLoading && (
                <div className="text-center mb-4 text-sm text-gray-500">
                  {language === "id"
                    ? "Mengunggah gambar..."
                    : "Uploading image..."}
                </div>
              )}

              <h3 className="text-xl font-semibold text-gray-800">
                {profile?.full_name || "-"}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {profile?.email || "-"}
              </p>

              {profile?.website && (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm mt-1 hover:underline"
                >
                  {profile.website}
                </a>
              )}

              <div className="mt-2 text-xs text-gray-400">
                {language === "id" ? "Bergabung pada: " : "Joined: "}
                {new Date(profile?.created_at).toLocaleDateString()}
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-6 w-full py-2 px-4 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {language === "id" ? "Edit Profil" : "Edit Profile"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow p-6 h-full">
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {language === "id" ? "Nama Lengkap" : "Full Name"}
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {language === "id" ? "Email" : "Email"}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {language === "id"
                      ? "Perubahan email memerlukan verifikasi ulang"
                      : "Email changes require reverification"}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {language === "id" ? "Website" : "Website"}
                  </label>
                  <div className="mt-1">
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {language === "id" ? "Menyimpan..." : "Saving..."}
                      </span>
                    ) : (
                      <span>{language === "id" ? "Simpan" : "Save"}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        fullName: profile.full_name || "",
                        email: profile.email || "",
                        website: profile.website || "",
                      });
                      setError(null);
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {language === "id" ? "Batal" : "Cancel"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  {language === "id" ? "Informasi Akun" : "Account Information"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      {language === "id" ? "Email" : "Email"}
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.email || "-"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      {language === "id" ? "Nama Lengkap" : "Full Name"}
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.full_name || "-"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      {language === "id" ? "Website" : "Website"}
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.website ? (
                        <a
                          href={
                            profile.website.startsWith("http")
                              ? profile.website
                              : `https://${profile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      {language === "id" ? "Tanggal Bergabung" : "Join Date"}
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(profile?.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      {language === "id"
                        ? "Terakhir Diperbarui"
                        : "Last Updated"}
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile?.updated_at
                        ? new Date(profile.updated_at).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 pb-2">
                    {language === "id" ? "Aktivitas" : "Activity"}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {language === "id"
                      ? "Informasi aktivitas pengguna belum tersedia."
                      : "User activity information is not available yet."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
