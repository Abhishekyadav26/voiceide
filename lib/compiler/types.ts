import type { Abi } from 'viem';

export interface CompileError {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column: number;
  message: string;
  type: string;
}

export interface CompiledContract {
  name: string;
  abi: Abi;
  bytecode: string;
  bytecodeSize: number;
  deployedBytecodeSize: number;
}

export interface CompileResult {
  success: boolean;
  contracts: CompiledContract[];
  errors: CompileError[];
  warnings: CompileError[];
  compileTimeMs: number;
}

export interface WorkerRequest {
  id: number;
  type: 'compile';
  files: Record<string, string>;
  solcVersion: string;
  optimizerRuns: number;
}

export interface WorkerResponse {
  id: number;
  type: 'compiled' | 'progress' | 'error';
  result?: CompileResult;
  message?: string;
  error?: string;
}
