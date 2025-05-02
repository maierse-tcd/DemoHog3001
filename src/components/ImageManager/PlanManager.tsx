
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ImageUploader } from '../ImageUploader';
import { Label } from '../ui/label';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Check, Edit, Plus, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Plan } from '../SubscriptionPlan';
import { safeCapture } from '../../utils/posthogUtils';

export interface SubscriptionPlanData {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  image_url?: string | null;
  recommended?: boolean;
}

export const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanData | null>(null);
  const [featureInput, setFeatureInput] = useState('');
  const { toast } = useToast();

  // Load plans from Supabase
  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');
      
      if (error) throw error;
      
      if (data) {
        setPlans(data as SubscriptionPlanData[]);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleEdit = (plan: SubscriptionPlanData) => {
    setCurrentPlan({...plan});
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentPlan({
      id: '',
      name: '',
      description: '',
      price: '',
      features: [],
      recommended: false,
    });
    setIsEditing(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim() || !currentPlan) return;
    
    setCurrentPlan({
      ...currentPlan,
      features: [...currentPlan.features, featureInput.trim()]
    });
    
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!currentPlan) return;
    
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.filter((_, i) => i !== index)
    });
  };

  const handleImageUploaded = (url: string) => {
    if (!currentPlan) return;
    
    setCurrentPlan({
      ...currentPlan,
      image_url: url
    });
  };

  const validatePlan = (): boolean => {
    if (!currentPlan) return false;
    
    if (!currentPlan.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Plan name is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!currentPlan.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Plan description is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!currentPlan.price.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Plan price is required',
        variant: 'destructive'
      });
      return false;
    }
    
    if (!currentPlan.id.trim()) {
      // Generate a slug-like ID from the name if not provided
      setCurrentPlan({
        ...currentPlan,
        id: currentPlan.name.toLowerCase().replace(/[^\w]+/g, '-')
      });
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!currentPlan || !validatePlan()) return;
    
    try {
      let operation;
      const planData = {...currentPlan};
      
      // Check if this is an update or create
      const existingPlan = plans.find(p => p.id === currentPlan.id);
      const isNewPlan = !existingPlan;
      
      if (existingPlan) {
        // Update existing plan
        operation = supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', currentPlan.id);
      } else {
        // Create new plan
        operation = supabase
          .from('subscription_plans')
          .insert(planData);
      }
      
      const { error } = await operation;
      
      if (error) throw error;
      
      // Track event in PostHog
      safeCapture(isNewPlan ? 'plan_created' : 'plan_updated', {
        plan_id: currentPlan.id,
        plan_name: currentPlan.name,
        plan_price: currentPlan.price,
        features_count: currentPlan.features.length,
        has_image: !!currentPlan.image_url,
        is_recommended: currentPlan.recommended
      });
      
      toast({
        title: existingPlan ? 'Plan Updated' : 'Plan Created',
        description: `${currentPlan.name} has been ${existingPlan ? 'updated' : 'created'} successfully.`
      });
      
      // Reload plans
      await loadPlans();
      
      // Close dialog
      setIsEditing(false);
      setCurrentPlan(null);
      
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save subscription plan',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm(`Are you sure you want to delete this plan? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // Find plan before deleting for analytics
      const planToDelete = plans.find(p => p.id === planId);
      
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
        
      if (error) throw error;
      
      // Track plan deletion in PostHog
      if (planToDelete) {
        safeCapture('plan_deleted', {
          plan_id: planId,
          plan_name: planToDelete.name,
          plan_price: planToDelete.price
        });
      }
      
      toast({
        title: 'Plan Deleted',
        description: 'The subscription plan has been deleted successfully.'
      });
      
      // Reload plans
      await loadPlans();
      
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subscription plan',
        variant: 'destructive'
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage your subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Manage your subscription plans</CardDescription>
          </div>
          <Button onClick={handleCreate} size="sm" className="bg-[#ea384c] hover:bg-red-700">
            <Plus size={16} className="mr-2" />
            Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <Card key={plan.id} className="overflow-hidden">
                {plan.image_url && (
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={plan.image_url} 
                      alt={plan.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.recommended && (
                      <span className="bg-[#ea384c] text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-lg font-bold">{plan.price}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2">{plan.description}</p>
                  <ul className="list-disc pl-5">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                    {plan.features.length > 3 && (
                      <li>+{plan.features.length - 3} more features</li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => handleEdit(plan)}>
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(plan.id)}>
                    <Trash size={16} className="mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan editing dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPlan?.id ? 'Edit' : 'Create'} Subscription Plan</DialogTitle>
            <DialogDescription>
              {currentPlan?.id ? 'Update' : 'Create a new'} subscription plan for your customers.
            </DialogDescription>
          </DialogHeader>

          {currentPlan && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id">Plan ID</Label>
                  <Input 
                    id="id" 
                    value={currentPlan.id}
                    onChange={e => setCurrentPlan({...currentPlan, id: e.target.value})}
                    placeholder="free-plan"
                    disabled={Boolean(plans.find(p => p.id === currentPlan.id))}
                  />
                  <p className="text-xs text-netflix-gray">Unique identifier for the plan.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input 
                    id="name" 
                    value={currentPlan.name}
                    onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})}
                    placeholder="Free Plan"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={currentPlan.description}
                  onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})}
                  placeholder="A brief description of the plan..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input 
                    id="price" 
                    value={currentPlan.price}
                    onChange={e => setCurrentPlan({...currentPlan, price: e.target.value})}
                    placeholder="$9.99/month"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="recommended"
                    checked={currentPlan.recommended || false}
                    onCheckedChange={checked => setCurrentPlan({...currentPlan, recommended: checked})}
                  />
                  <Label htmlFor="recommended">Set as recommended plan</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Plan Image</Label>
                <div className="border rounded-md p-4">
                  {currentPlan.image_url ? (
                    <div className="relative w-full h-40 mb-4">
                      <img 
                        src={currentPlan.image_url} 
                        alt={currentPlan.name} 
                        className="w-full h-full object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setCurrentPlan({...currentPlan, image_url: null})}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-netflix-gray text-sm mb-2">Upload an image for this plan</p>
                    </div>
                  )}
                  <ImageUploader onImageUploaded={handleImageUploaded} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="border rounded-md p-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={featureInput}
                        onChange={e => setFeatureInput(e.target.value)}
                        placeholder="Add a feature..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                      />
                      <Button onClick={handleAddFeature}>
                        <Plus size={16} />
                      </Button>
                    </div>
                    
                    <ul className="mt-4 space-y-2">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-netflix-darkgray rounded">
                          <div className="flex items-center">
                            <Check size={16} className="text-netflix-red mr-2" />
                            <span>{feature}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveFeature(index)}
                          >
                            <Trash size={14} />
                          </Button>
                        </li>
                      ))}
                      {currentPlan.features.length === 0 && (
                        <li className="text-netflix-gray text-sm italic">No features added</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#ea384c] hover:bg-red-700">Save Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
