import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useRole } from "../contexts/RoleContext";
import { UserPlus, Users, X } from "lucide-react";

interface CreateConseilDialogProps {
  children: React.ReactNode;
  buildingId: number;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Member {
  userId: number;
  role: 'president' | 'member' | 'secretary' | 'treasurer';
  user?: User;
}

export default function CreateConseilDialog({ children, buildingId }: CreateConseilDialogProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { getBackendClient } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch building owners (only owners of this building can be conseil members)
  const { data: ownersData } = useQuery({
    queryKey: ["building-owners", buildingId],
    queryFn: async () => {
      return await getBackendClient().owners.getBuildingOwners({ buildingId });
    },
    enabled: open,
  });

  const users = ownersData?.owners || [];

  const createConseilMutation = useMutation({
    mutationFn: async (data: { 
      buildingId: number; 
      members: Array<{ 
        userId: number; 
        role: 'president' | 'member' | 'secretary' | 'treasurer';
        termEndDate?: Date;
      }>
    }) => {
      return await getBackendClient().conseil.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["conseil"] });
      toast({
        title: "Success",
        description: "Conseil de copropriété created successfully",
      });
      setOpen(false);
      setMembers([]);
    },
    onError: (error: any) => {
      console.error("Failed to create conseil:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create conseil",
        variant: "destructive",
      });
    },
  });

  const addMember = () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select both user and role",
        variant: "destructive",
      });
      return;
    }

    const userId = parseInt(selectedUserId);
    const existingMember = members.find(m => m.userId === userId);
    if (existingMember) {
      toast({
        title: "Error",
        description: "User is already a member",
        variant: "destructive",
      });
      return;
    }

    // Check if president role is already taken
    if (selectedRole === 'president' && members.some(m => m.role === 'president')) {
      toast({
        title: "Error",
        description: "President role is already assigned",
        variant: "destructive",
      });
      return;
    }

    const user = users.find((u: User) => u.id === userId);
    setMembers([...members, {
      userId,
      role: selectedRole as Member['role'],
      user
    }]);
    setSelectedUserId("");
    setSelectedRole("");
  };

  const removeMember = (userId: number) => {
    setMembers(members.filter(m => m.userId !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (members.length === 0) {
      toast({
        title: "Error",
        description: "At least one member must be added",
        variant: "destructive",
      });
      return;
    }

    // Ensure there's a president
    if (!members.some(m => m.role === 'president')) {
      toast({
        title: "Error",
        description: "A president must be appointed",
        variant: "destructive",
      });
      return;
    }

    createConseilMutation.mutate({
      buildingId,
      members: members.map(m => ({ 
        userId: m.userId, 
        role: m.role,
        termEndDate: undefined
      }))
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Conseil de Copropriété
          </DialogTitle>
          <DialogDescription>
            Create a supervisory council to monitor the syndic's management according to Belgian legislation. Council members must be elected from the building owners.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Add Member Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Add Council Members</h4>
              <p className="text-xs text-muted-foreground">Select from building owners only</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user">Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No building owners found
                        </div>
                      ) : (
                        users.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="president">President</SelectItem>
                      <SelectItem value="secretary">Secretary</SelectItem>
                      <SelectItem value="treasurer">Treasurer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addMember}
                className="w-full"
                disabled={!selectedUserId || !selectedRole}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Current Members */}
            {members.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Council Members ({members.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {member.user ? `${member.user.firstName} ${member.user.lastName}` : `User ${member.userId}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user?.email}
                          </p>
                        </div>
                        <Badge variant={member.role === 'president' ? 'default' : 'secondary'}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members added yet</p>
                <p className="text-sm">Add at least one building owner to create the conseil</p>
                {users.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">
                    No building owners found. Owners must be added to units first.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createConseilMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createConseilMutation.isPending || members.length === 0}
            >
              {createConseilMutation.isPending ? "Creating..." : "Create Conseil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}