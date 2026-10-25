export type RootScreenName =
  | 'Login'
  | 'Register'
  | 'EmailVerification'
  | 'ForgotPassword'
  | 'ResetPassword'
  | 'Home'
  | 'Profile'
  | 'CompanyList'
  | 'CompanyDetails'
  | 'CompanyForm'
  | 'TransactionList'
  | 'TransactionDetails'
  | 'TransactionForm'
  | 'InterestCalculator'
  | 'DalaliCalculator';

export interface ScreenParams {
  Login: { message?: string; initialPhone?: string } | undefined;
  Register: undefined;
  EmailVerification: { email: string; fromRegistration?: boolean };
  ForgotPassword: { initialEmail?: string } | undefined;
  ResetPassword: { email: string };
  Home: undefined;
  Profile: undefined;
  CompanyList: undefined;
  CompanyDetails: { companyId: string };
  CompanyForm: { companyId?: string };
  TransactionList: { companyId?: string };
  TransactionDetails: { transactionId: string };
  TransactionForm: {
    transactionId?: string;
    defaultCompanyId?: string;
    initialAmount?: number;
    initialDalaliRate?: number;
    initialDalaliAmount?: number;
  };
  InterestCalculator:
    | {
        initialPrincipal?: number;
        initialRate?: number;
        initialTime?: number;
        initialUnit?: 'months' | 'years';
        initialBillAmount?: number;
        initialDalaliRate?: number;
      }
    | undefined;
  DalaliCalculator:
    | {
        initialBillAmount?: number;
        initialDalaliRate?: number;
      }
    | undefined;
}

export interface NavigationState {
  screen: RootScreenName;
  params?: any;
}

export interface NavigationContextType {
  currentScreen: RootScreenName;
  params: any;
  canGoBack: boolean;
  navigate: <T extends RootScreenName>(
    screen: T,
    params?: ScreenParams[T]
  ) => void;
  goBack: () => void;
  reset: <T extends RootScreenName>(
    screen: T,
    params?: ScreenParams[T]
  ) => void;
}
