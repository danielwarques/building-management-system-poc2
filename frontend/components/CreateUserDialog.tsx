import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import { useRole } from "../contexts/RoleContext";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateUserForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: string;
  phone: string;
  companyName: string;
}

export default function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const [form, setForm] = useState<CreateUserForm>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    userType: "",
    phone: "",
    companyName: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getBackendClient } = useRole();

  const createUserMutation = useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      userType: "building_owner" | "syndic" | "administrator";
      phone?: string;
      companyName?: string;
    }) => getBackendClient().auth.register(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User created",
        description: "New user has been created successfully.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Error creating user:", error);
      
      let errorMessage = "Failed to create user. Please try again.";
      
      // Try to extract more specific error message
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      userType: "",
      phone: "",
      companyName: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.email || !form.password || !form.firstName || !form.lastName || !form.userType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    const validUserTypes = ["building_owner", "syndic", "administrator"];
    if (!validUserTypes.includes(form.userType)) {
      toast({
        title: "Validation Error",
        description: "Please select a valid user type.",
        variant: "destructive",
      });
      return;
    }

    // Require company name for syndics
    if (form.userType === "syndic" && !form.companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required for syndics.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      userType: form.userType as "building_owner" | "syndic" | "administrator",
      phone: form.phone || undefined,
      companyName: form.companyName || undefined,
    });
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the building management system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Enter password (min 6 characters)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">User Type *</Label>
            <Select value={form.userType} onValueChange={(value) => handleInputChange("userType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="building_owner">Building Owner</SelectItem>
                <SelectItem value="syndic">Syndic</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.userType === "syndic" && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number (optional)"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}