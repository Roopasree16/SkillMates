import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Search, File, Trash2, Download, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  created_at: string;
}

interface SharedResourcesProps {
  userId: string;
  onBack: () => void;
}

const CATEGORIES = [
  "Programming",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "DevOps",
  "Databases",
  "Engineering",
  "Other",
];

const SharedResources = ({ userId, onBack }: SharedResourcesProps) => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("shared_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!title || !category || !file) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      // Save resource record
      const { error: insertError } = await supabase
        .from("shared_resources")
        .insert({
          user_id: userId,
          title,
          description: description || null,
          category,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
        });

      if (insertError) throw insertError;

      toast({
        title: "Resource uploaded!",
        description: "Your resource has been shared successfully.",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setFile(null);
      setShowUploadForm(false);
      fetchResources();
    } catch (error: any) {
      console.error("Error uploading resource:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resource.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (resource.user_id !== userId) return;

    try {
      // Extract file path from URL
      const urlParts = resource.file_url.split("/resources/");
      if (urlParts[1]) {
        await supabase.storage.from("resources").remove([urlParts[1]]);
      }

      const { error } = await supabase
        .from("shared_resources")
        .delete()
        .eq("id", resource.id);

      if (error) throw error;

      toast({
        title: "Resource deleted",
        description: "The resource has been removed.",
      });

      fetchResources();
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete resource.",
        variant: "destructive",
      });
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || resource.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-primary flex-1">Shared Resources</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowUploadForm(!showUploadForm)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="mb-6 border-border">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground mb-4">Upload New Resource</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this resource"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Resource"}
              </Button>
              <Button variant="outline" onClick={() => setShowUploadForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-2">No Resources Found</h3>
            <p className="text-muted-foreground text-sm">
              {resources.length === 0
                ? "Be the first to share a resource!"
                : "No resources match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <File className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                          {resource.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    {resource.user_id === userId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(resource)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedResources;
