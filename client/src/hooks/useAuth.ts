import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      name
      email
      roles
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        roles
      }
    }
  }
`;

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const navigate = useNavigate();
  const client = useApolloClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await client.query({ query: GET_CURRENT_USER });
      setState({ user: data.me, loading: false, error: null });
    } catch (error) {
      setState({ user: null, loading: false, error: null });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await client.mutate({
        mutation: LOGIN,
        variables: { email, password },
      });
      localStorage.setItem('token', data.login.token);
      setState({ user: data.login.user, loading: false, error: null });
      navigate('/');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Invalid email or password',
      }));
    }
  };

  const logout = async () => {
    try {
      await client.mutate({ mutation: LOGOUT });
      localStorage.removeItem('token');
      setState({ user: null, loading: false, error: null });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    logout,
  };
}; 