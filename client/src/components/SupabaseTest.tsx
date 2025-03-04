import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Box, Typography, CircularProgress } from '@mui/material';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to fetch a simple query to test the connection
        const { data, error } = await supabase
          .from('boards')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to connect to Supabase');
      }
    };

    testConnection();
  }, []);

  return (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Supabase Connection Test
      </Typography>
      {status === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {status === 'success' && (
        <Typography color="success.main">
          ✓ Successfully connected to Supabase!
        </Typography>
      )}
      {status === 'error' && (
        <Typography color="error">
          ✗ Connection failed: {error}
        </Typography>
      )}
    </Box>
  );
}; 