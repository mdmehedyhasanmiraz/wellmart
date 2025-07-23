"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";

export default function SiteSettingsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [settings, setSettings] = useState({
    site_name: "Wellmart",
    logo_url: "",
    bank_details: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      branch: "",
      routingNumber: "",
      swiftCode: "",
      instructions: [""]
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data } = await supabase.from("site_settings").select("*").order("updated_at", { ascending: false }).limit(1).single();
    if (data) {
      setSettings({
        site_name: data.site_name,
        logo_url: data.logo_url || "",
        bank_details: data.bank_details || {
          bankName: "",
          accountName: "",
          accountNumber: "",
          branch: "",
          routingNumber: "",
          swiftCode: "",
          instructions: [""]
        }
      });
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      bank_details: { ...prev.bank_details, [name]: value }
    }));
  };

  const handleInstructionsChange = (idx: number, value: string) => {
    setSettings((prev) => ({
      ...prev,
      bank_details: {
        ...prev.bank_details,
        instructions: prev.bank_details.instructions.map((ins, i) => (i === idx ? value : ins))
      }
    }));
  };

  const addInstruction = () => {
    setSettings((prev) => ({
      ...prev,
      bank_details: {
        ...prev.bank_details,
        instructions: [...prev.bank_details.instructions, ""]
      }
    }));
  };

  const removeInstruction = (idx: number) => {
    setSettings((prev) => ({
      ...prev,
      bank_details: {
        ...prev.bank_details,
        instructions: prev.bank_details.instructions.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let logoUrl = settings.logo_url;
    try {
      if (logoFile) {
        setLogoUploading(true);
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `logos/site-logo-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(fileName, logoFile, { upsert: true });
        setLogoUploading(false);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("images").getPublicUrl(fileName);
        logoUrl = publicUrlData?.publicUrl || "";
      }
      // Upsert settings (only one row)
      const { error } = await supabase.from("site_settings").upsert({
        site_name: settings.site_name,
        logo_url: logoUrl,
        bank_details: settings.bank_details,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success("Site settings saved!");
      setLogoFile(null);
      fetchSettings();
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
      setLogoUploading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Site Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Site Name</label>
          <input
            type="text"
            name="site_name"
            value={settings.site_name}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Site Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          {logoUploading && <p className="text-xs text-gray-500 mt-1">Uploading logo...</p>}
          {logoFile && !logoUploading && (
            <img src={URL.createObjectURL(logoFile)} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded border" />
          )}
          {!logoFile && settings.logo_url && (
            <img src={settings.logo_url} alt="Current Logo" className="mt-2 w-32 h-32 object-cover rounded border" />
          )}
        </div>
        {/* Bank Details */}
        <div>
          <label className="block text-lg font-semibold mb-2">Bank Details (for checkout)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input type="text" name="bankName" value={settings.bank_details.bankName} onChange={handleBankChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <input type="text" name="accountName" value={settings.bank_details.accountName} onChange={handleBankChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input type="text" name="accountNumber" value={settings.bank_details.accountNumber} onChange={handleBankChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <input type="text" name="branch" value={settings.bank_details.branch} onChange={handleBankChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Routing Number</label>
              <input type="text" name="routingNumber" value={settings.bank_details.routingNumber} onChange={handleBankChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SWIFT Code</label>
              <input type="text" name="swiftCode" value={settings.bank_details.swiftCode} onChange={handleBankChange} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Instructions</label>
            {settings.bank_details.instructions.map((ins, idx) => (
              <div key={idx} className="flex items-center mb-2">
                <input
                  type="text"
                  value={ins}
                  onChange={e => handleInstructionsChange(idx, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <button type="button" onClick={() => removeInstruction(idx)} className="ml-2 text-red-500">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addInstruction} className="mt-2 px-3 py-1 bg-lime-600 text-white rounded">Add Instruction</button>
          </div>
        </div>
        <div>
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-lime-600 text-white font-semibold rounded-lg shadow hover:bg-lime-700 transition-colors disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
} 