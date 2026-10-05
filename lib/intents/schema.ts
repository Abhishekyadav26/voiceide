import { z } from 'zod';

export const IntentTypeSchema = z.enum([
  'write_contract',
  'edit_contract',
  'compile',
  'fix_errors',
  'explain',
  'audit',
  'deploy',
  'verify',
  'call_function',
  'set_constructor_args',
  'undo',
  'clarify',
  'navigate_step',
  'set_template',
]);

export const IntentSchema = z.object({
  intent: IntentTypeSchema,
  contractName: z.string().max(64).optional(),
  fileName: z.string().max(128).optional(),
  template: z.enum(['erc20', 'erc721', 'erc1155', 'vault', 'multisig', 'crowdfunding']).optional(),
  description: z.string().max(2000).optional(),
  code: z.string().max(60000).optional(),
  functionName: z.string().max(64).optional(),
  functionArgs: z.array(z.string().max(500)).max(20).optional(),
  constructorArgs: z.array(z.string().max(500)).max(20).optional(),
  question: z.string().max(300).optional(),
  message: z.string().max(2000).optional(),
  direction: z.enum(['next', 'back']).optional(),
});

export type Intent = z.infer<typeof IntentSchema>;
export type IntentType = z.infer<typeof IntentTypeSchema>;

export const ParseRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  activeFile: z.string().max(128),
  fileList: z.array(z.string().max(128)).max(50),
  activeCode: z.string().max(60000),
  compilerOutput: z.string().max(8000).optional().default(''),
  deployments: z.array(z.object({ name: z.string(), address: z.string() })).max(30).optional().default([]),
});

export type ParseRequest = z.infer<typeof ParseRequestSchema>;
