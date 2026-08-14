import type { ScanResult, StellarNetwork } from './types';
export declare class ApiError extends Error {
    status: number;
    retryAfter?: number;
    constructor(status: number, message: string, retryAfter?: number);
}
export declare class TimeoutError extends Error {
    constructor();
}
export interface SorobanGuardClientOptions {
    baseUrl?: string;
    apiKey?: string;
}
export declare class SorobanGuardClient {
    private baseUrl;
    private apiKey?;
    constructor(options?: SorobanGuardClientOptions);
    /**
     * Submit source code to the Soroban Guard API for scanning.
     * @param source - Contract source code or identifier
     * @param network - Optional Stellar network to target
     * @returns Scan result including findings and optional quota info
     * @throws {ApiError} On HTTP errors or rate limiting
     */
    scan(source: string, network?: StellarNetwork): Promise<ScanResult>;
}
