import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useRole } from "../contexts/RoleContext";

interface CreateBuildingDialogProps {
  children: React.ReactNode;
}

export default function CreateBuildingDialog({ children }: CreateBuildingDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [unitsCount, setUnitsCount] = useState("");
  const [syndicType, setSyndicType] = useState<'professional' | 'voluntary'>('professional');
  const [syndicCompanyName, setSyndicCompanyName] = useState("");
  const [syndicContactEmail, setSyndicContactEmail] = useState("");
  const [syndicContactPhone, setSyndicContactPhone] = useState("");
  const { getBackendClient } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBuildingMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      address: string; 
      unitsCount: number;
      syndicType: 'professional' | 'voluntary';
      syndicCompanyName?: string;
      syndicContactEmail?: string;
      syndicContactPhone?: string;
    }) => {
      return await getBackendClient().buildings.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast({
        title: "Success",
        description: "Building created successfully",
      });
      setOpen(false);
      setName("");
      setAddress("");
      setUnitsCount("");
      setSyndicType('professional');
      setSyndicCompanyName("");
      setSyndicContactEmail("");
      setSyndicContactPhone("");
    },
    onError: (error: any) => {
      console.error("Failed to create building:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create building",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !address.trim() || !unitsCount.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (syndicType === 'professional' && !syndicCompanyName.trim()) {
      toast({
        title: "Error",
        description: "Company name is required for professional syndic",
        variant: "destructive",
      });
      return;
    }

    const units = parseInt(unitsCount);
    if (isNaN(units) || units < 1) {
      toast({
        title: "Error",
        description: "Units count must be a positive number",
        variant: "destructive",
      });
      return;
    }

    createBuildingMutation.mutate({
      name: name.trim(),
      address: address.trim(),
      unitsCount: units,
      syndicType,
      syndicCompanyName: syndicCompanyName.trim() || undefined,
      syndicContactEmail: syndicContactEmail.trim() || undefined,
      syndicContactPhone: syndicContactPhone.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Building</DialogTitle>
          <DialogDescription>
            Enter the building details and syndic information according to Belgian co-ownership law.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Building Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter building name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter building address"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitsCount">Number of Units *</Label>
              <Input
                id="unitsCount"
                type="number"
                min="1"
                value={unitsCount}
                onChange={(e) => setUnitsCount(e.target.value)}
                placeholder="Enter number of units"
                required
              />
            </div>
            
            {/* Syndic Information */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-foreground">Syndic Information</h4>
              
              <div className="grid gap-2">
                <Label htmlFor="syndicType">Syndic Type *</Label>
                <Select value={syndicType} onValueChange={(value: 'professional' | 'voluntary') => setSyndicType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional Syndic</SelectItem>
                    <SelectItem value="voluntary">Voluntary Syndic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {syndicType === 'professional' && (
                <div className="grid gap-2">
                  <Label htmlFor="syndicCompanyName">Company Name *</Label>
                  <Input
                    id="syndicCompanyName"
                    value={syndicCompanyName}
                    onChange={(e) => setSyndicCompanyName(e.target.value)}
                    placeholder="Enter syndic company name"
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="syndicContactEmail">Contact Email</Label>
                <Input
                  id="syndicContactEmail"
                  type="email"
                  value={syndicContactEmail}
                  onChange={(e) => setSyndicContactEmail(e.target.value)}
                  placeholder="Enter contact email"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="syndicContactPhone">Contact Phone</Label>
                <Input
                  id="syndicContactPhone"
                  type="tel"
                  value={syndicContactPhone}
                  onChange={(e) => setSyndicContactPhone(e.target.value)}
                  placeholder="Enter contact phone"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createBuildingMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBuildingMutation.isPending}
            >
              {createBuildingMutation.isPending ? "Creating..." : "Create Building"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}