// Minimal type declaration for dotenv to satisfy TS in this project
// This avoids TS2307 when importing {config as loadEnv} from 'dotenv'
declare module 'dotenv' {
  export interface DotenvConfigOptions {
    path?: string
    encoding?: string
    debug?: boolean
    override?: boolean
  }
  export interface DotenvConfigOutput {
    parsed?: Record<string, string>
    error?: Error
  }
  export function config(options?: DotenvConfigOptions): DotenvConfigOutput
}
