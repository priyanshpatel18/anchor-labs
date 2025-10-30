/**
 * Type definitions for the Program Initialization Wizard
 */

export type IdlInputMethod = "editor" | "upload" | "get-idl-from-address";

export type WizardStepId = 1 | 2 | 3;

export interface WizardStep {
  id: WizardStepId;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export interface ProgramInitializationWizardProps {
  onComplete?: () => void;
}

export interface IdlConfigurationStepProps {
  onNext: () => void;
}

export interface NetworkConnectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export interface InitializationReviewStepProps {
  onBack: () => void;
  onComplete?: () => void;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorDescription?: string;
}

export interface JsonProcessingResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ProgramInitializationConfig {
  idl: unknown;
  rpcUrl: string;
  walletPublicKey: string;
}

export interface WizardNavigationState {
  currentStep: WizardStepId;
  canProceed: boolean;
  canGoBack: boolean;
}
