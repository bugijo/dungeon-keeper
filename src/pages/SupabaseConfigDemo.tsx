
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SupabaseConfigDemo() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the correct type for the select method - no string argument needed
      const { data, error } = await supabase
        .from('profiles')
        .select();
      
      if (error) throw error;
      
      setUsers(data || []);
      toast({
        title: "Success",
        description: `Retrieved ${data?.length || 0} users from the database.`,
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to fetch users',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Config Demo</h1>
      
      <div className="mb-6">
        <Button onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Users from Supabase'}
        </Button>
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {users.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Users from Supabase:</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(users, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-100 text-blue-800 rounded">
        <h3 className="font-bold mb-2">Connection Details:</h3>
        <p>
          Project ID: <code>iilbczoanafeqzjqovjb</code>
        </p>
      </div>
    </div>
  );
}
