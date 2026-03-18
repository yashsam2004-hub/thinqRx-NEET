"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Save,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Resource {
  id?: string;
  category: string;
  title: string;
  description: string;
  url: string;
  image_url?: string;
  icon_name: string;
  is_external: boolean;
  is_active: boolean;
  display_order: number;
}

const CATEGORIES = [
  { value: "reference_books", label: "Reference Books" },
  { value: "video_lectures", label: "Video Lectures" },
  { value: "official_links", label: "Official Links" },
];

const ICON_OPTIONS = [
  "Beaker",
  "Pill",
  "Microscope",
  "Youtube",
  "Video",
  "ExternalLink",
  "Newspaper",
  "BookMarked",
  "Globe",
];

export default function AdminResourcesPage() {
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Partial<Resource>>({
    category: "reference_books",
    title: "",
    description: "",
    url: "",
    image_url: "",
    icon_name: "ExternalLink",
    is_external: true,
    is_active: true,
    display_order: 0,
  });
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("category")
        .order("display_order");

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast.error("Failed to load resources: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      if (!formData.title || !formData.description || !formData.url) {
        toast.error("Please fill in all required fields");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("resources")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Resource updated successfully");
      } else {
        // Create new
        const { error } = await supabase
          .from("resources")
          .insert([formData]);

        if (error) throw error;
        toast.success("Resource created successfully");
      }

      setEditingId(null);
      setIsCreating(false);
      setFormData({
        category: "reference_books",
        title: "",
        description: "",
        url: "",
        image_url: "",
        icon_name: "ExternalLink",
        is_external: true,
        is_active: true,
        display_order: 0,
      });
      fetchResources();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  }

  function startEdit(resource: Resource) {
    setEditingId(resource.id!);
    setFormData(resource);
    setIsCreating(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      category: "reference_books",
      title: "",
      description: "",
      url: "",
      image_url: "",
      icon_name: "ExternalLink",
      is_external: true,
      is_active: true,
      display_order: 0,
    });
  }

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) acc[resource.category] = [];
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Manage Resources
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Add and manage resources for students (Reference Books, Video Lectures, Official Links)
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6 mb-8 border-teal-200 dark:border-teal-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            {editingId ? "Edit Resource" : "Create New Resource"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Icon
              </label>
              <select
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., NTA NEET Official Website"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the resource"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                URL * (use # for coming soon)
              </label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com or #"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Image URL (optional - for book covers, video thumbnails)
              </label>
              <Input
                value={formData.image_url || ""}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg or leave empty"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                💡 Tip: Use direct image URLs (e.g., from Imgur, Amazon book covers, YouTube thumbnails)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_external}
                  onChange={(e) => setFormData({ ...formData, is_external: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">External Link</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Resource
            </Button>
            <Button onClick={cancelEdit} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Resources by Category */}
      <div className="space-y-8">
        {CATEGORIES.map((category) => {
          const categoryResources = groupedResources[category.value] || [];
          
          return (
            <div key={category.value}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {category.label}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({categoryResources.length})
                </span>
              </h2>

              {categoryResources.length === 0 ? (
                <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No resources in this category yet
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryResources.map((resource) => (
                    <Card key={resource.id} className="p-4">
                      {/* Image Preview */}
                      {resource.image_url && (
                        <div className="mb-3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={resource.image_url}
                            alt={resource.title}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {resource.title}
                            </h3>
                            {!resource.is_active && (
                              <Badge variant="outline" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {resource.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Order: {resource.display_order}</span>
                            <span>•</span>
                            <span>{resource.icon_name}</span>
                            {resource.is_external && (
                              <>
                                <span>•</span>
                                <ExternalLink className="h-3 w-3" />
                              </>
                            )}
                            {resource.image_url && (
                              <>
                                <span>•</span>
                                <span>📸 Image</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(resource)}
                          className="flex-1 gap-1"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(resource.id!)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
