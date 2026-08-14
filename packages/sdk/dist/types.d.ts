export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export interface Finding {
    check_name: string;
    severity: Severity;
    file_path: string;
    line: number;
    function_name: string;
    description: string;
    remediation?: string;
}
export interface ScanResponse {
    findings: Finding[];
}
export interface ScanRequest {
    source: string;
}
export interface ScanQuota {
    remaining: number;
    limit: number;
    resetAt: number;
}
export interface ScanResult extends ScanResponse {
    quota?: ScanQuota;
}
export interface StellarNetwork {
    name: 'mainnet' | 'testnet' | 'futurenet';
    networkPassphrase: string;
    horizonUrl: string;
    sorobanRpcUrl: string;
}
