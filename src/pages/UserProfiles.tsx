import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { getMyProfile, updateMyProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";

type ProfileFormData = {
  name: string;
  phone: string;
  bio: string;
  country: string;
  city_state: string;
  postal_code: string;
  tax_id: string;
  instagram_url: string;
  facebook_url: string;
  linkedin_url: string;
  x_url: string;
};

const EMPTY_FORM: ProfileFormData = {
  name: "",
  phone: "",
  bio: "",
  country: "",
  city_state: "",
  postal_code: "",
  tax_id: "",
  instagram_url: "",
  facebook_url: "",
  linkedin_url: "",
  x_url: "",
};

export default function UserProfiles() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [picture, setPicture] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getMyProfile();
        if (cancelled) return;
        setEmail(data.email || "");
        setRole(data.role || "editor");
        setPicture(data.picture || null);
        setForm({
          name: data.name || session?.user?.name || "",
          phone: data.profile?.phone || "",
          bio: data.profile?.bio || "",
          country: data.profile?.country || "",
          city_state: data.profile?.city_state || "",
          postal_code: data.profile?.postal_code || "",
          tax_id: data.profile?.tax_id || "",
          instagram_url: data.profile?.instagram_url || "",
          facebook_url: data.profile?.facebook_url || "",
          linkedin_url: data.profile?.linkedin_url || "",
          x_url: data.profile?.x_url || "",
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el perfil",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.name]);

  const onChange = (field: keyof ProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isDirty = useMemo(() => {
    return Object.values(form).some((value) => value.trim().length > 0);
  }, [form]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setEmail(updated.email || email);
      setRole(updated.role || role);
      setPicture(updated.picture || picture);
      setForm({
        name: updated.name || "",
        phone: updated.profile?.phone || "",
        bio: updated.profile?.bio || "",
        country: updated.profile?.country || "",
        city_state: updated.profile?.city_state || "",
        postal_code: updated.profile?.postal_code || "",
        tax_id: updated.profile?.tax_id || "",
        instagram_url: updated.profile?.instagram_url || "",
        facebook_url: updated.profile?.facebook_url || "",
        linkedin_url: updated.profile?.linkedin_url || "",
        x_url: updated.profile?.x_url || "",
      });
      toast.success("Perfil actualizado");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el perfil",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Descuenta.me | Perfil"
        description="Gestiona tus datos de perfil de usuario en Descuenta.me."
      />
      <PageBreadcrumb pageTitle="Perfil" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            {picture ? (
              <img
                src={picture}
                alt="Perfil"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {form.name || "Usuario"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
            <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {role}
            </span>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cargando perfil...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="col-span-1 lg:col-span-2">
              <Label>Nombre</Label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
              />
            </div>

            <div>
              <Label>Teléfono</Label>
              <Input
                type="text"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Input
                type="text"
                value={form.bio}
                onChange={(e) => onChange("bio", e.target.value)}
              />
            </div>
            <div>
              <Label>País</Label>
              <Input
                type="text"
                value={form.country}
                onChange={(e) => onChange("country", e.target.value)}
              />
            </div>
            <div>
              <Label>Ciudad / Región</Label>
              <Input
                type="text"
                value={form.city_state}
                onChange={(e) => onChange("city_state", e.target.value)}
              />
            </div>
            <div>
              <Label>Código Postal</Label>
              <Input
                type="text"
                value={form.postal_code}
                onChange={(e) => onChange("postal_code", e.target.value)}
              />
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input
                type="text"
                value={form.tax_id}
                onChange={(e) => onChange("tax_id", e.target.value)}
              />
            </div>
            <div>
              <Label>Instagram URL</Label>
              <Input
                type="text"
                value={form.instagram_url}
                onChange={(e) => onChange("instagram_url", e.target.value)}
              />
            </div>
            <div>
              <Label>Facebook URL</Label>
              <Input
                type="text"
                value={form.facebook_url}
                onChange={(e) => onChange("facebook_url", e.target.value)}
              />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                type="text"
                value={form.linkedin_url}
                onChange={(e) => onChange("linkedin_url", e.target.value)}
              />
            </div>
            <div>
              <Label>X URL</Label>
              <Input
                type="text"
                value={form.x_url}
                onChange={(e) => onChange("x_url", e.target.value)}
              />
            </div>

            <div className="col-span-1 mt-2 lg:col-span-2">
              <Button
                size="sm"
                disabled={saving || !isDirty}
                onClick={handleSave}
              >
                {saving ? "Guardando..." : "Guardar Perfil"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
