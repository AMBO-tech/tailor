import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Workshop, AuthResponse, LoginDto, RegisterDto } from '@types';
import { authService } from '@services/api/auth.service';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  workshops: Workshop[];
  currentWorkshop: Workshop | null;
  handleAuthSuccess: (data: AuthResponse) => void;
  login: (dto: LoginDto) => Promise<AuthResponse>;
  register: (dto: RegisterDto) => Promise<AuthResponse>;
  selectWorkshop: (ws: Workshop) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('tailor_token'),
  );

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tailor_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [workshops, setWorkshops] = useState<Workshop[]>(() => {
    const saved = localStorage.getItem('tailor_workshops');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentWorkshop, setCurrentWorkshop] = useState<Workshop | null>(() => {
    const saved = localStorage.getItem('tailor_workshop');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = useCallback(
    (data: AuthResponse) => {
      const activeToken = data.token || data.accessToken || '';
      const initialWorkshop = data.workshops?.[0] || null;

      setToken(activeToken);
      setUser(data.user);
      setWorkshops(data.workshops || []);
      setCurrentWorkshop(initialWorkshop);

      if (activeToken) {
        localStorage.setItem('tailor_token', activeToken);
      }
      if (data.user) {
        localStorage.setItem('tailor_user', JSON.stringify(data.user));
      }
      if (data.workshops) {
        localStorage.setItem('tailor_workshops', JSON.stringify(data.workshops));
      }
      if (initialWorkshop) {
        localStorage.setItem('tailor_workshop', JSON.stringify(initialWorkshop));
        localStorage.setItem('tailor_workshop_id', initialWorkshop.workshopId);
      }
    },
    [],
  );

  const login = useCallback(
    async (dto: LoginDto) => {
      setIsLoading(true);
      try {
        const res = await authService.login(dto);
        handleAuthSuccess(res);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      setIsLoading(true);
      try {
        const res = await authService.register(dto);
        handleAuthSuccess(res);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const selectWorkshop = useCallback((ws: Workshop) => {
    setCurrentWorkshop(ws);
    localStorage.setItem('tailor_workshop', JSON.stringify(ws));
    localStorage.setItem('tailor_workshop_id', ws.workshopId);
    window.location.reload();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tailor_token');
    localStorage.removeItem('tailor_user');
    localStorage.removeItem('tailor_workshops');
    localStorage.removeItem('tailor_workshop');
    localStorage.removeItem('tailor_workshop_id');

    setToken(null);
    setUser(null);
    setWorkshops([]);
    setCurrentWorkshop(null);

    navigate('/login', { replace: true });
  }, [navigate]);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        isAuthenticated: !!token,
        isLoading,
        token,
        user,
        workshops,
        currentWorkshop,
        handleAuthSuccess,
        login,
        register,
        selectWorkshop,
        logout,
      },
    },
    children,
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

