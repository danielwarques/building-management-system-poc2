import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "../contexts/RoleContext";
import { useToast } from "@/components/ui/use-toast";

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateIssueDialog({ open, onOpenChange }: CreateIssueDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    buildingId: "",
    assetId: "none",
  });

  const { getBackendClient } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => getBackendClient().buildings.list(),
    enabled: open,
  });

  const { data: buildingDetails } = useQuery({
    queryKey: ["building-details", formData.buildingId],
    queryFn: () => getBackendClient().buildings.get({ id: parseInt(formData.buildingId) }),
    enabled: !!formData.buildingId,
  });

  const createIssueMutation = useMutation({
    mutationFn: (data: any) => getBackendClient().issues.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Issue created successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating issue",
        description: error.message,
        variant: "destructive",
      });
      console.error("Create issue error:", error);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      buildingId: "",
      assetId: "none",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.buildingId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createIssueMutation.mutate({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      buildingId: parseInt(formData.buildingId),
      assetId: formData.assetId && formData.assetId !== "none" ? parseInt(formData.assetId) : undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset asset selection when building changes
    if (field === "buildingId") {
      setFormData(prev => ({ ...prev, assetId: "none" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report New Issue</DialogTitle>
          <DialogDescription>
            Create a new maintenance request or report an issue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Detailed description of the issue"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building">Building *</Label>
            <Select value={formData.buildingId} onValueChange={(value) => handleChange("buildingId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a building" />
              </SelectTrigger>
              <SelectContent>
                {buildings?.buildings?.map((building: any) => (
                  <SelectItem key={building.id} value={building.id.toString()}>
                    {building.name} - {building.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {buildingDetails?.assets && buildingDetails.assets.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="asset">Related Asset (Optional)</Label>
              <Select value={formData.assetId} onValueChange={(value) => handleChange("assetId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific asset</SelectItem>
                  {buildingDetails?.assets?.map((asset: any) => (
                    <SelectItem key={asset.id} value={asset.id.toString()}>
                      {asset.name} ({asset.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createIssueMutation.isPending}>
              {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
